// api/dados-compra.js - Apenas busca dados do Firebase e cria ingresso
import admin from "firebase-admin";

// Inicializa Firebase Admin apenas uma vez
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error("ERRO Firebase Init:", err.message);
  }
}

const db = admin.firestore();

// Função para formatar data
function formatarData(timestamp) {
  if (!timestamp) return "A definir";
  if (timestamp.toDate) return timestamp.toDate().toLocaleString("pt-BR");
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toLocaleString("pt-BR");
  return "A definir";
}

// ===== HANDLER =====
export default async function handler(req, res) {
  // CORS
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Apenas POST permitido" });
  }

  try {
    const { usuarioID, eventoID, loteID } = req.body;

    if (!usuarioID || !eventoID || !loteID) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltam dados: usuarioID, eventoID, loteID" 
      });
    }

    // Buscar documentos
    const [usuarioDoc, eventoDoc, loteDoc] = await Promise.all([
      db.collection("Usuario").doc(usuarioID).get(),
      db.collection("Evento").doc(eventoID).get(),
      db.collection("Lote").doc(loteID).get(),
    ]);

    if (!usuarioDoc.exists || !eventoDoc.exists || !loteDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário, evento ou lote não encontrado" 
      });
    }

    const usuario = { id: usuarioID, ...usuarioDoc.data() };
    const evento = { id: eventoID, ...eventoDoc.data() };
    const lote = { id: loteID, ...loteDoc.data() };

    if (!lote.quantidade || lote.quantidade <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Ingressos esgotados para este lote" 
      });
    }

    // Criar ingresso + decrementar quantidade em transação
    const ingressoRef = db.collection("Ingresso").doc();
    const ingressoID = ingressoRef.id;

    await db.runTransaction(async (transaction) => {
      const loteAtualizado = await transaction.get(loteDoc.ref);
      const qtdAtual = loteAtualizado.data().quantidade || 0;

      if (qtdAtual <= 0) {
        throw new Error("Ingressos esgotados durante o processamento");
      }

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

      transaction.update(loteDoc.ref, { 
        quantidade: admin.firestore.FieldValue.increment(-1) 
      });
    });

    // Retorna os dados necessários para envio de email
    const dataFormatada = formatarData(evento.dataInicio);
    
    return res.status(200).json({
      success: true,
      message: "Ingresso criado com sucesso!",
      data: {
        ingressoID,
        usuario: {
          nome: usuario.nome,
          email: usuario.email
        },
        evento: {
          titulo: evento.titulo,
          local: evento.local || "A definir",
          dataInicio: dataFormatada
        },
        lote: {
          nome: lote.nome,
          preco: lote.preco.toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error("[ERRO]", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Erro ao processar compra" 
    });
  }
}