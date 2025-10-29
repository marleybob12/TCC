import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { gerarPDF } from "./gerarPDF.js"; // PDF centralizado

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Firebase Admin
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Configuração SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.seuservidor.com", // ex: smtp.gmail.com
  port: 587,
  secure: false,
  auth: { user: "marleytfox@gmail.com", pass: "lubn ohny cgbz drmf" }
});

// ----------------------
// Endpoint: comprar e enviar ingresso individual
// ----------------------
app.post("/enviar-ingresso", async (req, res) => {
  try {
    const { eventoID, usuarioID, loteID } = req.body;

    // Busca dados do evento
    const eventoSnap = await db.collection("Evento").doc(eventoID).get();
    if (!eventoSnap.exists) return res.status(404).send("Evento não encontrado.");
    const evento = { id: eventoSnap.id, ...eventoSnap.data() };

    // Busca dados do usuário
    const usuarioSnap = await db.collection("Usuario").doc(usuarioID).get();
    if (!usuarioSnap.exists) return res.status(404).send("Usuário não encontrado.");
    const usuario = { id: usuarioSnap.id, ...usuarioSnap.data() };

    // Busca dados do lote
    const loteSnap = await db.collection("Lote").doc(loteID).get();
    if (!loteSnap.exists) return res.status(404).send("Lote não encontrado.");
    const lote = { id: loteSnap.id, ...loteSnap.data() };

    // Gera PDF do ingresso
    const pdfPath = await gerarPDF(usuario, evento, lote);

    // Envia por e-mail
    await transporter.sendMail({
      from: '"EventFlow" <marleytfox@gmail.com>',
      to: usuario.email,
      subject: `Ingresso: ${evento.titulo}`,
      text: `Olá ${usuario.nome}, segue seu ingresso em anexo.`,
      attachments: [{ filename: "ingresso.pdf", path: pdfPath }]
    });

    // Marca como enviado
    await db.collection("Inscricao").doc(usuarioID).update({ ingressoEnviado: true });

    // Remove PDF temporário
    fs.unlinkSync(pdfPath);

    res.send("Ingresso enviado com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar ingresso:", error);
    res.status(500).send("Erro ao enviar ingresso.");
  }
});

// ----------------------
// Endpoint: enviar ingressos pendentes de um evento (lote)
// ----------------------
app.post("/enviar-ingressos-lote", async (req, res) => {
  try {
    const { eventoID } = req.body;

    // Busca inscrições pendentes
    const snapshot = await db.collection("Inscricao")
      .where("eventoID", "==", eventoID)
      .where("ingressoEnviado", "==", false)
      .get();

    if (snapshot.empty) {
      return res.status(200).send("Não há ingressos pendentes para este evento.");
    }

    // Busca dados do evento apenas uma vez
    const eventoSnap = await db.collection("Evento").doc(eventoID).get();
    if (!eventoSnap.exists) return res.status(404).send("Evento não encontrado.");
    const evento = { id: eventoSnap.id, ...eventoSnap.data() };

    // Itera sobre cada inscrição pendente
    for (const docSnap of snapshot.docs) {
      const usuario = { id: docSnap.id, ...docSnap.data() };

      // Busca lote do usuário
      const loteSnap = await db.collection("Lote").doc(usuario.loteID).get();
      if (!loteSnap.exists) {
        console.warn(`Lote não encontrado para usuário ${usuario.id}`);
        continue;
      }
      const lote = { id: loteSnap.id, ...loteSnap.data() };

      // Gera PDF
      const pdfPath = await gerarPDF(usuario, evento, lote);

      // Envia e-mail
      await transporter.sendMail({
        from: '"EventFlow" <marleytfox@gmail.com>',
        to: usuario.email,
        subject: `Ingresso: ${evento.titulo}`,
        text: `Olá ${usuario.nome}, segue seu ingresso em anexo.`,
        attachments: [{ filename: "ingresso.pdf", path: pdfPath }]
      });

      // Marca como enviado
      await db.collection("Inscricao").doc(usuario.id).update({ ingressoEnviado: true });

      // Remove PDF temporário
      fs.unlinkSync(pdfPath);
    }

    res.send("Todos os ingressos pendentes foram enviados com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar ingressos em lote:", error);
    res.status(500).send("Erro ao enviar ingressos em lote.");
  }
});

// ----------------------
// Inicia servidor
// ----------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
