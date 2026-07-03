import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { admin, getDb, handleOptions, applyCors, formatarData, toDateOrNull } from "./_firebase.js";

function dinheiro(valor = 0) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function gerarPDFIngresso({ usuario, evento, lote, ingressoID, qrCodeData }) {
  const chunks = [];
  const doc = new PDFDocument({ size: "A4", margin: 48 });

  return new Promise(async (resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.rect(0, 0, 595, 842).fill("#F6F8FF");
      doc.roundedRect(42, 42, 511, 758, 22).fill("#FFFFFF").stroke("#DDE3FF");

      doc.fillColor("#5533ff").fontSize(28).text("EventFlow", 72, 82);
      doc.fillColor("#111827").fontSize(18).text("Ingresso digital", 72, 118);
      doc.moveDown();

      doc.fillColor("#111827").fontSize(24).text(evento.titulo || "Evento", 72, 170, { width: 450 });
      doc.fillColor("#4B5563").fontSize(12).text(evento.descricao || "", { width: 450, height: 48 });

      const linhas = [
        ["Participante", usuario.nome || usuario.email || "Usuário"],
        ["Data", formatarData(evento.dataInicio)],
        ["Local", evento.local || evento.cidade || "A definir"],
        ["Endereço", evento.endereco || "A definir"],
        ["Ingresso", lote.nome || "Ingresso"],
        ["Valor", dinheiro(lote.preco)],
        ["Código", ingressoID]
      ];

      let y = 300;
      for (const [label, value] of linhas) {
        doc.fillColor("#6B7280").fontSize(10).text(label.toUpperCase(), 72, y);
        doc.fillColor("#111827").fontSize(13).text(String(value), 72, y + 14, { width: 320 });
        y += 48;
      }

      const qrImage = await QRCode.toDataURL(qrCodeData, { errorCorrectionLevel: "H", width: 280, margin: 1 });
      const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
      doc.image(qrBuffer, 354, 318, { width: 145, height: 145 });
      doc.fillColor("#6B7280").fontSize(9).text("Apresente este QR Code na entrada", 340, 472, { width: 178, align: "center" });

      doc.roundedRect(72, 704, 451, 44, 12).fill("#EEF2FF");
      doc.fillColor("#4338CA").fontSize(11).text("Esse ingresso é pessoal. A validação deve ser feita no painel do organizador.", 90, 719, { width: 415, align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function emailConfigurado() {
  return Boolean(process.env.GMAIL_EMAIL && process.env.GMAIL_SENHA);
}

async function enviarEmailIngresso({ usuario, evento, lote, ingressoID, pdfBuffer }) {
  if (!emailConfigurado()) {
    return { enviado: false, motivo: "GMAIL_EMAIL/GMAIL_SENHA não configurados" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_SENHA
    }
  });

  await transporter.sendMail({
    from: `"EventFlow" <${process.env.GMAIL_EMAIL}>`,
    to: usuario.email,
    subject: `Seu ingresso para ${evento.titulo}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Ingresso confirmado 🎟️</h2>
        <p>Olá, <strong>${usuario.nome || "participante"}</strong>!</p>
        <p>Sua compra para <strong>${evento.titulo}</strong> foi confirmada.</p>
        <p>
          <strong>Data:</strong> ${formatarData(evento.dataInicio)}<br>
          <strong>Local:</strong> ${evento.local || evento.cidade || "A definir"}<br>
          <strong>Ingresso:</strong> ${lote.nome}<br>
          <strong>Valor:</strong> ${dinheiro(lote.preco)}<br>
          <strong>Código:</strong> ${ingressoID}
        </p>
        <p>O PDF está anexado. Apresente o QR Code na entrada do evento.</p>
      </div>
    `,
    attachments: [{
      filename: `Ingresso_EventFlow_${ingressoID}.pdf`,
      content: pdfBuffer
    }]
  });

  return { enviado: true };
}

export default async function handler(req, res) {
  if (handleOptions(req, res, "POST,OPTIONS")) return;
  applyCors(req, res, "POST,OPTIONS");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Use POST para comprar ingresso." });
  }

  try {
    const { usuarioID, eventoID, loteID } = req.body || {};
    if (!usuarioID || !eventoID || !loteID) {
      return res.status(400).json({ success: false, message: "Informe usuarioID, eventoID e loteID." });
    }

    const db = getDb();
    const usuarioRef = db.collection("Usuario").doc(usuarioID);
    const eventoRef = db.collection("Evento").doc(eventoID);
    const loteRef = db.collection("Lote").doc(loteID);

    const [usuarioSnap, eventoSnap, loteSnap] = await Promise.all([
      usuarioRef.get(),
      eventoRef.get(),
      loteRef.get()
    ]);

    if (!usuarioSnap.exists) return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    if (!eventoSnap.exists) return res.status(404).json({ success: false, message: "Evento não encontrado." });
    if (!loteSnap.exists) return res.status(404).json({ success: false, message: "Lote não encontrado." });

    const usuario = { id: usuarioSnap.id, ...usuarioSnap.data() };
    const evento = { id: eventoSnap.id, ...eventoSnap.data() };
    const lote = { id: loteSnap.id, ...loteSnap.data() };

    if (lote.eventoID && lote.eventoID !== eventoID) {
      return res.status(400).json({ success: false, message: "Esse lote não pertence ao evento informado." });
    }

    const agora = new Date();
    const inicioVenda = toDateOrNull(lote.dataInicioVenda);
    const fimVenda = toDateOrNull(lote.dataFimVenda);
    if (inicioVenda && agora < inicioVenda) return res.status(400).json({ success: false, message: "As vendas deste lote ainda não começaram." });
    if (fimVenda && agora > fimVenda) return res.status(400).json({ success: false, message: "As vendas deste lote já encerraram." });

    const ingressoRef = db.collection("Ingresso").doc();
    const ingressoID = ingressoRef.id;
    const qrCodeData = `EVENTFLOW:${ingressoID}:${eventoID}:${usuarioID}`;

    await db.runTransaction(async (transaction) => {
      const loteAtual = await transaction.get(loteRef);
      if (!loteAtual.exists) throw new Error("Lote não encontrado durante a compra.");

      const quantidade = Number(loteAtual.data().quantidade || 0);
      if (quantidade <= 0) throw new Error("Ingressos esgotados para este lote.");

      transaction.set(ingressoRef, {
        eventoID,
        loteID,
        usuarioID,
        organizadorID: evento.organizadorID || lote.organizadorID || null,
        status: "ativo",
        nomeEvento: evento.titulo || "Evento",
        nomeLote: lote.nome || "Ingresso",
        preco: Number(lote.preco || 0),
        qrCodeData,
        emailEnviado: false,
        dataCompra: admin.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(loteRef, {
        quantidade: admin.firestore.FieldValue.increment(-1),
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    const pdfBuffer = await gerarPDFIngresso({ usuario, evento, lote, ingressoID, qrCodeData });
    const resultadoEmail = await enviarEmailIngresso({ usuario, evento, lote, ingressoID, pdfBuffer });

    await ingressoRef.update({
      emailEnviado: resultadoEmail.enviado,
      erroEmail: resultadoEmail.enviado ? null : resultadoEmail.motivo,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      message: resultadoEmail.enviado
        ? "Ingresso comprado e enviado por e-mail com sucesso."
        : "Ingresso comprado com sucesso. Configure Gmail para envio automático por e-mail.",
      data: {
        ingressoID,
        eventoTitulo: evento.titulo,
        loteNome: lote.nome,
        usuarioEmail: usuario.email,
        emailEnviado: resultadoEmail.enviado,
        qrCodeData
      }
    });
  } catch (error) {
    console.error("[comprar-ingresso]", error);
    return res.status(500).json({ success: false, message: error.message || "Erro ao processar compra." });
  }
}
