import { admin, getDb, handleOptions, applyCors, formatarData } from "./_firebase.js";

export default async function handler(req, res) {
  if (handleOptions(req, res, "POST,OPTIONS")) return;
  applyCors(req, res, "POST,OPTIONS");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Use POST para validar ingresso." });
  }

  try {
    const { ingressoID, organizadorID } = req.body || {};
    if (!ingressoID) {
      return res.status(400).json({ success: false, message: "Informe o código do ingresso." });
    }

    const db = getDb();
    const ingressoRef = db.collection("Ingresso").doc(String(ingressoID).trim());
    const ingressoSnap = await ingressoRef.get();

    if (!ingressoSnap.exists) {
      return res.status(404).json({ success: false, message: "Ingresso não encontrado." });
    }

    const ingresso = { id: ingressoSnap.id, ...ingressoSnap.data() };
    const eventoSnap = await db.collection("Evento").doc(ingresso.eventoID).get();
    const evento = eventoSnap.exists ? { id: eventoSnap.id, ...eventoSnap.data() } : null;

    if (organizadorID && evento?.organizadorID && evento.organizadorID !== organizadorID) {
      return res.status(403).json({ success: false, message: "Este ingresso pertence a outro organizador." });
    }

    if (ingresso.status === "usado") {
      return res.status(409).json({
        success: false,
        message: "Este ingresso já foi usado.",
        data: {
          ingressoID: ingresso.id,
          status: ingresso.status,
          validadoEm: formatarData(ingresso.validadoEm),
          nomeEvento: ingresso.nomeEvento
        }
      });
    }

    if (ingresso.status !== "ativo") {
      return res.status(400).json({ success: false, message: `Ingresso com status inválido: ${ingresso.status}` });
    }

    await ingressoRef.update({
      status: "usado",
      validadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      message: "Ingresso validado com sucesso.",
      data: {
        ingressoID: ingresso.id,
        nomeEvento: ingresso.nomeEvento,
        nomeLote: ingresso.nomeLote,
        preco: ingresso.preco,
        eventoData: evento ? formatarData(evento.dataInicio) : "A definir"
      }
    });
  } catch (error) {
    console.error("[validar-ingresso]", error);
    return res.status(500).json({ success: false, message: error.message || "Erro ao validar ingresso." });
  }
}
