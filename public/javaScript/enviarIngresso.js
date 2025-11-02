import { db } from "./firebaseConfig.js";
import nodemailer from "nodemailer";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

// Configurar SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.seuservidor.com",
  port: 587,
  secure: false,
  auth: {
    user: "seuemail@dominio.com",
    pass: "suasenha"
  }
});

// Envia PDF para um usuário
async function enviarIngresso(usuario, pdfPath) {
  try {
    await transporter.sendMail({
      from: '"EventFlow" <seuemail@dominio.com>',
      to: usuario.email,
      subject: "Seu ingresso EventFlow",
      text: `Olá ${usuario.nome}, segue seu ingresso em anexo.`,
      attachments: [{ filename: "ingresso.pdf", path: pdfPath }]
    });

    console.log(`Ingresso enviado para: ${usuario.email}`);

    // Marca como enviado no Firestore
    const inscricaoRef = doc(db, "Inscricao", usuario.id);
    await updateDoc(inscricaoRef, { ingressoEnviado: true });
  } catch (error) {
    console.error(`Erro ao enviar para ${usuario.email}:`, error);
  }
}

// Função principal para enviar ingressos de um evento
export async function enviarIngressosDoEvento(eventoID, pdfPath) {
  const q = query(
    collection(db, "Inscricao"),
    where("eventoID", "==", eventoID),
    where("ingressoEnviado", "==", false)
  );

  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    const usuario = { id: docSnap.id, ...docSnap.data() };
    await enviarIngresso(usuario, pdfPath);
  }

  console.log("Todos os ingressos processados.");
}
