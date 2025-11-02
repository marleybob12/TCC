import { db } from "../javaScript/firebaseAdmin.js";
import { gerarPDF } from "../javaScript/gerarPDF.js"; // ou adapte para serverless

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método não permitido" });
  }

  try {
    const { usuarioID, eventoID, loteID } = req.body;
    if (!usuarioID || !eventoID || !loteID) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    // 🔹 Pega o lote do Firestore
    const loteRef = db.collection("Lote").doc(loteID);
    const loteDoc = await loteRef.get();
    if (!loteDoc.exists) {
      return res.status(404).json({ success: false, message: "Lote não encontrado" });
    }

    const loteData = loteDoc.data();
    if (loteData.quantidade <= 0) {
      return res.status(400).json({ success: false, message: "Lote esgotado" });
    }

    // 🔹 Decrementa a quantidade (transação para evitar race condition)
    await db.runTransaction(async (t) => {
      const loteSnap = await t.get(loteRef);
      const atual = loteSnap.data().quantidade;
      if (atual <= 0) throw new Error("Lote esgotado");
      t.update(loteRef, { quantidade: atual - 1 });
    });

    // 🔹 Cria o ingresso
    const ingressoRef = await db.collection("Ingresso").add({
      usuarioID,
      eventoID,
      loteID,
      dataCompra: new Date(),
    });

    // 🔹 Gera PDF (adapte gerarPDF para retornar buffer ou link)
    await gerarPDF(ingressoRef.id, usuarioID, eventoID, loteID);

    return res.status(200).json({
      success: true,
      message: "Ingresso comprado e enviado por email!",
      ingressoID: ingressoRef.id,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Erro interno" });
  }
}
