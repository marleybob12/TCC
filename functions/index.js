// index.js
import express from "express";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Configurar e-mail (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_SENHA,
  },
});

const app = express();
app.use(express.json());

// ============================================
// ROTA HTTP - Comprar e Enviar Ingresso
// ============================================
app.post("/comprar-ingresso", async (req, res) => {
  try {
    const { usuarioID, eventoID, loteID } = req.body;

    if (!usuarioID) return res.status(401).json({ success: false, message: "Usuário não autenticado" });

    console.log(`Iniciando compra - Usuario: ${usuarioID}, Evento: ${eventoID}, Lote: ${loteID}`);

    const [usuarioDoc, eventoDoc, loteDoc] = await Promise.all([
      db.collection("Usuario").doc(usuarioID).get(),
      db.collection("Evento").doc(eventoID).get(),
      db.collection("Lote").doc(loteID).get(),
    ]);

    if (!usuarioDoc.exists) return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    if (!eventoDoc.exists) return res.status(404).json({ success: false, message: "Evento não encontrado" });
    if (!loteDoc.exists) return res.status(404).json({ success: false, message: "Lote não encontrado" });

    const usuario = { id: usuarioID, ...usuarioDoc.data() };
    const evento = { id: eventoID, ...eventoDoc.data() };
    const lote = { id: loteID, ...loteDoc.data() };

    if (lote.quantidade <= 0) return res.status(400).json({ success: false, message: "Ingressos esgotados para este lote" });

    const ingressoRef = await db.collection("Ingresso").add({
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

    await db.collection("Lote").doc(loteID).update({
      quantidade: admin.firestore.FieldValue.increment(-1),
    });

    const pdfBuffer = await gerarPDFIngresso(usuario, evento, lote, ingressoRef.id);

    const dataEvento = evento.dataInicio?.toDate ? evento.dataInicio.toDate().toLocaleString('pt-BR') : 'A definir';

    await transporter.sendMail({
      from: `"EventFlow" <${process.env.GMAIL_EMAIL}>`,
      to: usuario.email,
      subject: `🎟️ Seu ingresso para ${evento.titulo}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Olá, ${usuario.nome}!</h2>
        <p>Seu ingresso para <strong>${evento.titulo}</strong> foi confirmado! 🎉</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📅 Data:</strong> ${dataEvento}</p>
          <p><strong>🎫 Lote:</strong> ${lote.nome}</p>
          <p><strong>💰 Valor:</strong> R$ ${lote.preco.toFixed(2)}</p>
          <p><strong>📍 Local:</strong> ${evento.local || 'A definir'}</p>
        </div>
        <p>O ingresso em PDF está anexo a este email. Apresente o QR Code na entrada do evento.</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          <strong>EventFlow</strong> - Sistema de Gestão de Eventos
        </p>
      </div>`,
      attachments: [{ filename: `Ingresso_${evento.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, content: pdfBuffer }],
    });

    await ingressoRef.update({ emailEnviado: true });

    console.log('✅ Compra finalizada com sucesso!');
    return res.json({ success: true, message: "Ingresso comprado e enviado por email!", ingressoID: ingressoRef.id });

  } catch (error) {
    console.error("❌ Erro na compra:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// FUNÇÃO AUXILIAR - Gerar PDF
// ============================================
async function gerarPDFIngresso(usuario, evento, lote, ingressoID) {
  return new Promise(async (resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Ingresso - ${evento.titulo}`, Author: 'EventFlow' } });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      doc.rect(0, 0, 595, 842).fill("#eaf6f6");
      doc.fillColor("#1E40AF").fontSize(28).text("🎟️ INGRESSO EVENTFLOW", { align: "center" });
      doc.moveDown(0.5).fontSize(10).fillColor("#6B7280").text("Apresente este QR Code na entrada", { align: "center" });
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#CBD5E1");
      doc.moveDown();
      doc.fillColor("#000000").fontSize(14);

      const dataEvento = evento.dataInicio?.toDate ? evento.dataInicio.toDate().toLocaleString('pt-BR') : 'A definir';

      doc.text(`👤 Nome: ${usuario.nome}`, 50);
      doc.moveDown(0.3); doc.text(`🎭 Evento: ${evento.titulo}`, 50);
      doc.moveDown(0.3); doc.text(`📅 Data: ${dataEvento}`, 50);
      doc.moveDown(0.3); doc.text(`📍 Local: ${evento.local || 'A definir'}`, 50);
      doc.moveDown(0.3); doc.text(`🎫 Lote: ${lote.nome}`, 50);
      doc.moveDown(0.3); doc.text(`💰 Valor: R$ ${lote.preco.toFixed(2)}`, 50);
      doc.moveDown(0.3); doc.fontSize(10).fillColor("#6B7280"); doc.text(`🔢 ID do Ingresso: ${ingressoID}`, 50);
      doc.moveDown(2);

      const qrData = `EVENTFLOW-${ingressoID}`;
      const qrImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H', width: 300 });
      const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
      const qrX = (595 - 200) / 2;
      doc.image(qrBuffer, qrX, doc.y, { fit: [200, 200] });
      doc.moveDown(12);

      doc.fontSize(9).fillColor("#9CA3AF");
      doc.text("Válido apenas com documento de identificação", { align: "center" });
      doc.text("EventFlow - Sistema de Gestão de Eventos", { align: "center" });

      doc.end();
    } catch (error) { reject(error); }
  });
}

// ============================================
// EXPORTAR APP PARA VERCEL
// ============================================
export default app;
