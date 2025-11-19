import admin from "firebase-admin";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Inicializa Firebase Admin apenas se não estiver inicializado
if (!admin.apps.length) {
  // Para Vercel, usa variáveis de ambiente ou serviceAccount em JSON
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID || "eventflow-87d51",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL || "marleytfox@gmail.com",
    pass: process.env.GMAIL_SENHA || "kryt byyf hdif jbil",
  },
});

// Função para gerar PDF do ingresso
async function gerarPDFIngresso(usuario, evento, lote, ingressoID) {
  return new Promise(async (resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      // Título
      doc.fillColor("#1E40AF").fontSize(24).text("🎟️ INGRESSO EVENTFLOW", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).fillColor("black");

      // Formata data do evento
      const dataEvento = evento.dataInicio?.toDate
        ? evento.dataInicio.toDate().toLocaleString("pt-BR")
        : evento.dataInicio?._seconds
        ? new Date(evento.dataInicio._seconds * 1000).toLocaleString("pt-BR")
        : "A definir";

      // Informações do ingresso
      doc.text(`👤 Nome: ${usuario.nome || 'Usuário'}`);
      doc.text(`🎭 Evento: ${evento.titulo || 'Evento'}`);
      doc.text(`📅 Data: ${dataEvento}`);
      doc.text(`📍 Local: ${evento.local || "A definir"}`);
      doc.text(`🎫 Lote: ${lote.nome || 'Lote'}`);
      doc.text(`💰 Valor: R$ ${(lote.preco || 0).toFixed(2)}`);
      doc.text(`🔢 ID do Ingresso: ${ingressoID}`);
      doc.moveDown();

      // Gera QR Code
      const qrData = `EVENTFLOW-${ingressoID}`;
      const qrImage = await QRCode.toDataURL(qrData, { 
        errorCorrectionLevel: "H", 
        width: 300 
      });
      const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
      
      // Centraliza QR Code
      const qrX = (595 - 200) / 2;
      doc.image(qrBuffer, qrX, doc.y, { fit: [200, 200] });

      doc.moveDown(2);
      doc.fontSize(10).fillColor("#6B7280");
      doc.text("Apresente este QR Code na entrada do evento", { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Handler principal
export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responde OPTIONS para preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }

  try {
    const { usuarioID, eventoID, loteID } = req.body;

    // Validação
    if (!usuarioID || !eventoID || !loteID) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos (usuarioID, eventoID, loteID são obrigatórios)' 
      });
    }

    console.log('📦 Processando compra:', { usuarioID, eventoID, loteID });

    // Busca dados em paralelo
    const [usuarioDoc, eventoDoc, loteDoc] = await Promise.all([
      db.collection("Usuario").doc(usuarioID).get(),
      db.collection("Evento").doc(eventoID).get(),
      db.collection("Lote").doc(loteID).get(),
    ]);

    // Validações
    if (!usuarioDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }
    if (!eventoDoc.exists) {
      return res.status(404).json({ success: false, message: "Evento não encontrado" });
    }
    if (!loteDoc.exists) {
      return res.status(404).json({ success: false, message: "Lote não encontrado" });
    }

    const usuario = { id: usuarioID, ...usuarioDoc.data() };
    const evento = { id: eventoID, ...eventoDoc.data() };
    const lote = { id: loteID, ...loteDoc.data() };

    console.log('✅ Dados carregados:', {
      usuario: usuario.nome,
      evento: evento.titulo,
      lote: lote.nome,
      quantidade: lote.quantidade
    });

    // Verifica disponibilidade
    if (lote.quantidade <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Ingressos esgotados para este lote" 
      });
    }

    // Transação: Cria ingresso e atualiza quantidade
    const ingressoRef = db.collection("Ingresso").doc();
    const ingressoID = ingressoRef.id;

    await db.runTransaction(async (transaction) => {
      // Re-verifica disponibilidade na transação
      const loteAtualizado = await transaction.get(loteDoc.ref);
      if (loteAtualizado.data().quantidade <= 0) {
        throw new Error('Ingressos esgotados durante o processamento');
      }

      // Cria ingresso
      transaction.set(ingressoRef, {
        eventoID,
        loteID,
        usuarioID,
        status: "ativo",
        dataCompra: admin.firestore.FieldValue.serverTimestamp(),
        emailEnviado: false,
        nomeEvento: evento.titulo,
        nomeLote: lote.nome,
        preco: lote.preco,
      });

      // Decrementa quantidade
      transaction.update(loteDoc.ref, {
        quantidade: admin.firestore.FieldValue.increment(-1),
      });
    });

    console.log('✅ Ingresso criado:', ingressoID);

    // Gera PDF
    console.log('📄 Gerando PDF...');
    const pdfBuffer = await gerarPDFIngresso(usuario, evento, lote, ingressoID);
    console.log('✅ PDF gerado');

    // Formata data para email
    const dataEvento = evento.dataInicio?.toDate
      ? evento.dataInicio.toDate().toLocaleString("pt-BR")
      : evento.dataInicio?._seconds
      ? new Date(evento.dataInicio._seconds * 1000).toLocaleString("pt-BR")
      : "A definir";

    // Envia email
    console.log('📧 Enviando email para:', usuario.email);
    await transporter.sendMail({
      from: `"EventFlow" <${process.env.GMAIL_EMAIL}>`,
      to: usuario.email,
      subject: `🎟️ Seu ingresso para ${evento.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #1E40AF; margin-top: 0;">🎉 Olá, ${usuario.nome}!</h2>
            <p style="font-size: 16px; color: #374151;">
              Seu ingresso para <strong style="color: #1E40AF;">${evento.titulo}</strong> foi confirmado com sucesso!
            </p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E40AF;">
              <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${dataEvento}</p>
              <p style="margin: 8px 0;"><strong>🎫 Lote:</strong> ${lote.nome}</p>
              <p style="margin: 8px 0;"><strong>💰 Valor:</strong> R$ ${lote.preco.toFixed(2)}</p>
              <p style="margin: 8px 0;"><strong>📍 Local:</strong> ${evento.local || "A definir"}</p>
              <p style="margin: 8px 0;"><strong>🔢 ID:</strong> ${ingressoID}</p>
            </div>
            <p style="font-size: 14px; color: #6B7280;">
              O ingresso em PDF está anexo a este email. <strong>Apresente o QR Code na entrada do evento.</strong>
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
                Obrigado por usar o EventFlow! 🎟️
              </p>
            </div>
          </div>
        </div>`,
      attachments: [
        {
          filename: `Ingresso_${evento.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_${ingressoID}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Email enviado');

    // Atualiza flag de email enviado
    await ingressoRef.update({ emailEnviado: true });

    // Retorna sucesso
    return res.status(200).json({
      success: true,
      message: 'Ingresso comprado e enviado por email com sucesso!',
      data: {
        ingressoID: ingressoID,
        eventoTitulo: evento.titulo,
        loteNome: lote.nome,
        usuarioEmail: usuario.email
      }
    });

  } catch (error) {
    console.error('❌ Erro ao processar compra:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar compra',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}