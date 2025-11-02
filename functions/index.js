import express from "express";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();
console.log("EMAIL:", process.env.GMAIL_EMAIL);
console.log("SENHA:", process.env.GMAIL_SENHA);



// Caminho para a chave baixada do Firebase

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve("../eventflow-87d51-firebase-adminsdk-fbsvc-50e7b0db9a.json"), "utf-8"));



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_SENHA,
  },
});

const app = express();
app.use(express.json());

app.post("/comprar-ingresso", async (req, res) => {
  try {
    const { usuarioID, eventoID, loteID } = req.body;

    if (!usuarioID)
      return res.status(401).json({ success: false, message: "Usuário não autenticado" });

    const [usuarioDoc, eventoDoc, loteDoc] = await Promise.all([
      db.collection("Usuario").doc(usuarioID).get(),
      db.collection("Evento").doc(eventoID).get(),
      db.collection("Lote").doc(loteID).get(),
    ]);

    if (!usuarioDoc.exists)
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    if (!eventoDoc.exists)
      return res.status(404).json({ success: false, message: "Evento não encontrado" });
    if (!loteDoc.exists)
      return res.status(404).json({ success: false, message: "Lote não encontrado" });

    const usuario = { id: usuarioID, ...usuarioDoc.data() };
    const evento = { id: eventoID, ...eventoDoc.data() };
    const lote = { id: loteID, ...loteDoc.data() };

    if (lote.quantidade <= 0)
      return res.status(400).json({ success: false, message: "Ingressos esgotados" });

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

    const dataEvento = evento.dataInicio?.toDate
      ? evento.dataInicio.toDate().toLocaleString("pt-BR")
      : "A definir";

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
          <p><strong>📍 Local:</strong> ${evento.local || "A definir"}</p>
        </div>
        <p>O ingresso em PDF está anexo a este email. Apresente o QR Code na entrada do evento.</p>
      </div>`,
      attachments: [
        {
          filename: `Ingresso_${evento.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    await ingressoRef.update({ emailEnviado: true });

    res.json({
      success: true,
      message: "Ingresso comprado e enviado por email!",
      ingressoID: ingressoRef.id,
    });
  } catch (error) {
    console.error("Erro na compra:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

async function gerarPDFIngresso(usuario, evento, lote, ingressoID) {
  return new Promise(async (resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.fillColor("#1E40AF").fontSize(24).text("🎟️ INGRESSO EVENTFLOW", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).fillColor("black");

      const dataEvento = evento.dataInicio?.toDate
        ? evento.dataInicio.toDate().toLocaleString("pt-BR")
        : "A definir";

      doc.text(`👤 Nome: ${usuario.nome}`);
      doc.text(`🎭 Evento: ${evento.titulo}`);
      doc.text(`📅 Data: ${dataEvento}`);
      doc.text(`📍 Local: ${evento.local || "A definir"}`);
      doc.text(`🎫 Lote: ${lote.nome}`);
      doc.text(`💰 Valor: R$ ${lote.preco.toFixed(2)}`);
      doc.text(`🔢 ID do Ingresso: ${ingressoID}`);
      doc.moveDown();

      const qrData = `EVENTFLOW-${ingressoID}`;
      const qrImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: "H", width: 300 });
      const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
      const qrX = (595 - 200) / 2;
      doc.image(qrBuffer, qrX, doc.y, { fit: [200, 200] });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


// 🔹 ESSA LINHA É FUNDAMENTAL PARA FUNCIONAR NA VERCEL
export default app;
