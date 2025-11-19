import admin from "firebase-admin";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// ===== FIREBASE ADMIN =====
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error("ERRO Firebase Init:", err.message);
    throw err;
  }
}

const db = admin.firestore();

// ===== EMAIL CONFIG (SEM credenciais padrão!) =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_SENHA,
  },
});

// ===== GERAR PDF =====
async function gerarPDFIngresso(usuario, evento, lote, ingressoID) {
  return new Promise(async (resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", err => reject(err));

      // Título
      doc.fillColor("#1E40AF").fontSize(24).text("🎟️ INGRESSO EVENTFLOW", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).fillColor("black");

      // Data formatada
      const dataEvento = evento.dataInicio?.toDate
        ? evento.dataInicio.toDate().toLocaleString("pt-BR")
        : evento.dataInicio?._seconds
        ? new Date(evento.dataInicio._seconds * 1000).toLocaleString("pt-BR")
        : "A definir";

      // Conteúdo
      doc.text(`👤 Nome: ${usuario.nome || 'Usuário'}`);
      doc.text(`🎭 Evento: ${evento.titulo || 'Evento'}`);
      doc.text(`📅 Data: ${dataEvento}`);
      doc.text(`📍 Local: ${evento.local || "A definir"}`);
      doc.text(`🎫 Lote: ${lote.nome || 'Lote'}`);
      doc.text(`💰 Valor: R$ ${(lote.preco || 0).toFixed(2)}`);
      doc.text(`🔢 ID: ${ingressoID}`);
      doc.moveDown();

      // QR Code
      const qrData = `EVENTFLOW-${ingressoID}`;
      const qrImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "H", width: 300 });
      const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
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

// ===== HANDLER VERCEL (SERVERLESS) =====
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Apenas POST permitido' });
  }

  try {
    const { usuarioID, eventoID, loteID } = req.body;

    // Validação
    if (!usuarioID || !eventoID || !loteID) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltam dados: usuarioID, eventoID, loteID' 
      });
    }

    console.log('[COMPRA]', { usuarioID, eventoID, loteID });

    // Buscar documentos
    const [usuarioDoc, eventoDoc, loteDoc] = await Promise.all([
      db.collection("Usuario").doc(usuarioID).get(),
      db.collection("Evento").doc(eventoID).get(),
      db.collection("Lote").doc(loteID).get(),
    ]);

    if (!usuarioDoc.exists || !eventoDoc.exists || !loteDoc.exists) {
      return res.status(404).json({ success: false, message: "Usuário, evento ou lote não encontrado" });
    }

    const usuario = { id: usuarioID, ...usuarioDoc.data() };
    const evento = { id: eventoID, ...eventoDoc.data() };
    const lote = { id: loteID, ...loteDoc.data() };

    // Verificar disponibilidade
    if (!lote.quantidade || lote.quantidade <= 0) {
      return res.status(400).json({ success: false, message: "Ingressos esgotados para este lote" });
    }

    // Transação Firestore
    const ingressoRef = db.collection("Ingresso").doc();
    const ingressoID = ingressoRef.id;

    await db.runTransaction(async (transaction) => {
      const loteAtualizado = await transaction.get(loteDoc.ref);
      const qtdAtual = loteAtualizado.data().quantidade || 0;
      
      if (qtdAtual <= 0) {
        throw new Error('Ingressos esgotados durante o processamento');
      }

      // Criar ingresso
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

      // Decrementar quantidade
      transaction.update(loteDoc.ref, {
        quantidade: admin.firestore.FieldValue.increment(-1),
      });
    });

    console.log('[INGRESSO CRIADO]', ingressoID);

    // Gerar PDF
    const pdfBuffer = await gerarPDFIngresso(usuario, evento, lote, ingressoID);

    // Data para email
    const dataEvento = evento.dataInicio?.toDate
      ? evento.dataInicio.toDate().toLocaleString("pt-BR")
      : evento.dataInicio?._seconds
      ? new Date(evento.dataInicio._seconds * 1000).toLocaleString("pt-BR")
      : "A definir";

    // Enviar email
    await transporter.sendMail({
      from: `"EventFlow" <${process.env.GMAIL_EMAIL}>`,
      to: usuario.email,
      subject: `🎟️ Seu ingresso para ${evento.titulo}`,
      html: `
        

          

            
🎉 Olá, ${usuario.nome}!

            

Seu ingresso para ${evento.titulo} foi confirmado com sucesso!


            

              

📅 Data: ${dataEvento}


              

🎫 Lote: ${lote.nome}


              

💰 Valor: R$ ${lote.preco.toFixed(2)}


              

📍 Local: ${evento.local || "A definir"}


              

🔢 ID: ${ingressoID}


            

            

O ingresso em PDF está anexado. Apresente o QR Code na entrada do evento.


            

              

Obrigado por usar EventFlow! 🎟️


            

          

        
`,
      attachments: [
        {
          filename: `Ingresso_${evento.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_${ingressoID}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('[EMAIL ENVIADO]', usuario.email);

    // Marcar email como enviado
    await ingressoRef.update({ emailEnviado: true });

    // Resposta sucesso
    return res.status(200).json({
      success: true,
      message: 'Ingresso comprado e enviado por email com sucesso!',
      data: {
        ingressoID,
        eventoTitulo: evento.titulo,
        loteNome: lote.nome,
        usuarioEmail: usuario.email
      }
    });

  } catch (error) {
    console.error('[ERRO]', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar compra'
    });
  }
}