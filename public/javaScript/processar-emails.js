// scripts/processar-emails.js - Executa localmente para enviar emails
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

// ===== FIREBASE ADMIN =====
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin inicializado");
  } catch (err) {
    console.error("❌ ERRO Firebase Init:", err.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// ===== EMAIL CONFIG =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_SENHA,
  },
});

// Verificar conexão SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erro na configuração SMTP:", error);
  } else {
    console.log("✅ SMTP configurado corretamente");
  }
});

// ===== GERAR PDF =====
async function gerarPDFIngresso(usuario, evento, lote, ingressoID) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../temp-pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfPath = path.join(pdfDir, `ingresso_${ingressoID}.pdf`);
      const chunks = [];
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

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
      doc.text(`👤 Nome: ${usuario.nome || "Usuário"}`);
      doc.text(`🎭 Evento: ${evento.titulo || "Evento"}`);
      doc.text(`📅 Data: ${dataEvento}`);
      doc.text(`📍 Local: ${evento.local || "A definir"}`);
      doc.text(`🎫 Lote: ${lote.nome || "Lote"}`);
      doc.text(`💰 Valor: R$ ${(lote.preco || 0).toFixed(2)}`);
      doc.text(`🆔 ID: ${ingressoID}`);
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

      writeStream.on('finish', () => resolve(pdfPath));
      writeStream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

// ===== PROCESSAR INGRESSOS PENDENTES =====
async function processarIngressosPendentes() {
  try {
    console.log("🔍 Buscando ingressos pendentes...");

    const ingressosSnap = await db.collection("Ingresso")
      .where("emailEnviado", "==", false)
      .limit(50) // Processa até 50 por vez
      .get();

    if (ingressosSnap.empty) {
      console.log("✅ Nenhum ingresso pendente encontrado");
      return;
    }

    console.log(`📧 Encontrados ${ingressosSnap.size} ingressos pendentes`);

    let sucessos = 0;
    let erros = 0;

    for (const ingressoDoc of ingressosSnap.docs) {
      const ingresso = ingressoDoc.data();
      const ingressoID = ingressoDoc.id;

      try {
        // Buscar dados relacionados
        const [usuarioDoc, eventoDoc, loteDoc] = await Promise.all([
          db.collection("Usuario").doc(ingresso.usuarioID).get(),
          db.collection("Evento").doc(ingresso.eventoID).get(),
          db.collection("Lote").doc(ingresso.loteID).get(),
        ]);

        if (!usuarioDoc.exists || !eventoDoc.exists || !loteDoc.exists) {
          console.warn(`⚠️ Dados incompletos para ingresso ${ingressoID}`);
          erros++;
          continue;
        }

        const usuario = usuarioDoc.data();
        const evento = eventoDoc.data();
        const lote = loteDoc.data();

        // Gerar PDF
        console.log(`📄 Gerando PDF para ${usuario.email}...`);
        const pdfPath = await gerarPDFIngresso(usuario, evento, lote, ingressoID);

        // Data formatada
        const dataEvento = evento.dataInicio?.toDate
          ? evento.dataInicio.toDate().toLocaleString("pt-BR")
          : evento.dataInicio?._seconds
          ? new Date(evento.dataInicio._seconds * 1000).toLocaleString("pt-BR")
          : "A definir";

        // Enviar email
        console.log(`✉️ Enviando email para ${usuario.email}...`);
        await transporter.sendMail({
          from: `"EventFlow" <${process.env.GMAIL_EMAIL}>`,
          to: usuario.email,
          subject: `🎟️ Seu ingresso para ${evento.titulo}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E40AF;">🎟️ Ingresso EventFlow</h2>
              <p>Olá, <strong>${usuario.nome}</strong>!</p>
              <p>Seu ingresso para <strong>${evento.titulo}</strong> foi confirmado com sucesso!</p>
              <hr>
              <p><strong>📅 Data:</strong> ${dataEvento}</p>
              <p><strong>🎫 Lote:</strong> ${lote.nome}</p>
              <p><strong>💰 Valor:</strong> R$ ${lote.preco.toFixed(2)}</p>
              <p><strong>📍 Local:</strong> ${evento.local || "A definir"}</p>
              <p><strong>🆔 ID:</strong> ${ingressoID}</p>
              <hr>
              <p>O ingresso em PDF está anexado. Apresente o QR Code na entrada do evento.</p>
              <p style="color: #6B7280;">Obrigado por usar EventFlow! 🎉</p>
            </div>
          `,
          attachments: [
            {
              filename: `Ingresso_${evento.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_${ingressoID}.pdf`,
              path: pdfPath,
            },
          ],
        });

        // Marcar como enviado
        await db.collection("Ingresso").doc(ingressoID).update({ 
          emailEnviado: true,
          dataEnvioEmail: admin.firestore.FieldValue.serverTimestamp()
        });

        // Remover PDF temporário
        fs.unlinkSync(pdfPath);

        console.log(`✅ Email enviado com sucesso para ${usuario.email}`);
        sucessos++;

        // Pequeno delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erro ao processar ingresso ${ingressoID}:`, error.message);
        erros++;
      }
    }

    console.log(`\n📊 Processamento concluído:`);
    console.log(`   ✅ Sucessos: ${sucessos}`);
    console.log(`   ❌ Erros: ${erros}`);

  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// ===== EXECUTAR =====
console.log("🚀 Iniciando processamento de emails...\n");
processarIngressosPendentes()
  .then(() => {
    console.log("\n✅ Processamento finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  }); 