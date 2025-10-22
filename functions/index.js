const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// 🔐 Configurações de e-mail seguras via variáveis de ambiente
// Você definirá esses valores no próximo passo
const gmailUser = functions.config().email.user;
const gmailPass = functions.config().email.pass;

// Cria o transportador de e-mails (usando Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

/**
 * Função HTTPS que envia um ingresso PDF por e-mail
 * Chamada via Firebase Functions Client SDK (httpsCallable)
 */
exports.sendTicketEmail = functions.https.onCall(async (data, context) => {
  const { toEmail, toName, evento, ingressoPDF } = data;

  // Validação básica
  if (!toEmail || !ingressoPDF || !evento) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Parâmetros inválidos."
    );
  }

  const mailOptions = {
    from: `"EventFlow" <${gmailUser}>`,
    to: toEmail,
    subject: `🎟 Seu ingresso para ${evento.titulo}`,
    html: `
      <h2>Olá, ${toName}!</h2>
      <p>Seu ingresso para o evento <b>${evento.titulo}</b> está em anexo.</p>
      <p><b>Data:</b> ${new Date(
        evento.dataInicio.seconds * 1000
      ).toLocaleString()}</p>
      <p><b>Local:</b> ${evento.local || "A definir"}</p>
      <p>Bom evento! 🎉</p>
      <p><b>Equipe EventFlow</b></p>
    `,
    attachments: [
      {
        filename: `Ingresso_${evento.titulo}.pdf`,
        content: ingressoPDF,
        encoding: "base64",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ E-mail enviado com sucesso para:", toEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Falha ao enviar o e-mail."
    );
  }
});
