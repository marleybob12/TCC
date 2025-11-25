// scripts/testar-conexao.js - Testa Firebase e SMTP
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("🔍 Testando Configurações...\n");

// ===== TESTE 1: Variáveis de Ambiente =====
console.log("📝 Teste 1: Variáveis de Ambiente");
const requiredEnvVars = ['FIREBASE_SERVICE_ACCOUNT', 'GMAIL_EMAIL', 'GMAIL_SENHA'];
let envOk = true;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: Definida`);
  } else {
    console.log(`   ❌ ${varName}: NÃO DEFINIDA`);
    envOk = false;
  }
});

if (!envOk) {
  console.log("\n❌ Configure as variáveis de ambiente no arquivo .env");
  process.exit(1);
}

// ===== TESTE 2: Firebase =====
console.log("\n🔥 Teste 2: Firebase Admin");
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  const db = admin.firestore();
  
  // Tenta ler um documento
  const testDoc = await db.collection("Evento").limit(1).get();
  
  console.log(`   ✅ Firebase conectado`);
  console.log(`   ✅ Encontrados ${testDoc.size} evento(s) de teste`);
  
} catch (error) {
  console.log(`   ❌ Erro no Firebase: ${error.message}`);
  process.exit(1);
}

// ===== TESTE 3: SMTP =====
console.log("\n📧 Teste 3: Configuração SMTP");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_SENHA,
  },
});

try {
  await transporter.verify();
  console.log(`   ✅ SMTP configurado corretamente`);
  console.log(`   ✅ Email: ${process.env.GMAIL_EMAIL}`);
} catch (error) {
  console.log(`   ❌ Erro no SMTP: ${error.message}`);
  console.log("\n💡 Dicas:");
  console.log("   - Use uma 'Senha de App' do Gmail, não a senha normal");
  console.log("   - Gere em: https://myaccount.google.com/apppasswords");
  process.exit(1);
}

// ===== TESTE 4: Email de Teste =====
console.log("\n✉️ Teste 4: Envio de Email (Opcional)");
console.log("   Deseja enviar um email de teste? (y/n)");

import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('   Resposta: ', async (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 's') {
    try {
      await transporter.sendMail({
        from: `"EventFlow Teste" <${process.env.GMAIL_EMAIL}>`,
        to: process.env.GMAIL_EMAIL,
        subject: "🧪 Teste do Sistema EventFlow",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1E40AF;">✅ Teste Bem-Sucedido!</h2>
            <p>O sistema de emails do EventFlow está funcionando corretamente.</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <hr>
            <p style="color: #6b7280; font-size: 0.9rem;">
              Este é um email de teste. Você pode ignorá-lo.
            </p>
          </div>
        `,
      });
      console.log("   ✅ Email de teste enviado com sucesso!");
      console.log(`   ✅ Verifique: ${process.env.GMAIL_EMAIL}`);
    } catch (error) {
      console.log(`   ❌ Erro ao enviar email: ${error.message}`);
    }
  } else {
    console.log("   ⏭️ Teste de email pulado");
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ TODOS OS TESTES CONCLUÍDOS");
  console.log("=".repeat(50));
  console.log("\n💡 Próximos passos:");
  console.log("   1. Execute: node scripts/processar-emails.js");
  console.log("   2. Configure agendamento automático (ver INSTRUCOES-EMAILS.md)");
  console.log("   3. Monitore os logs regularmente\n");
  
  rl.close();
  process.exit(0);
});