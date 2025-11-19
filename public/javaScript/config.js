// ===========================
// IMPORTS
// ===========================
import { auth, db } from "../javaScript/firebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  updatePassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===========================
// ELEMENTOS DO DOM
// ===========================

// Conta
const nomeEl = document.getElementById("nome");
const emailEl = document.getElementById("email");
const telefoneEl = document.getElementById("telefone");
const cpfEl = document.getElementById("cpf");
const dataNascimentoEl = document.getElementById("dataNascimento");
const novaSenhaEl = document.getElementById("novaSenha");
const mensagemEl = document.getElementById("mensagem");

// Privacidade
const visibilidadePerfilEl = document.getElementById("visibilidadePerfil");
const compartilharAtividadesEl = document.getElementById("compartilharAtividades");
const ocultarEmailEl = document.getElementById("ocultarEmail");
const ocultarTelefoneEl = document.getElementById("ocultarTelefone");

// Notificações
const notEmailEl = document.getElementById("notEmail");
const notPushEl = document.getElementById("notPush");
const notSMSEl = document.getElementById("notSMS");
const notMarketingEl = document.getElementById("notMarketing");

// Preferências
const idiomaEl = document.getElementById("idioma");
const fusoHorarioEl = document.getElementById("fusoHorario");
const temaEl = document.getElementById("tema");

// Segurança
const doisFAEl = document.getElementById("2fa");
const historicoEl = document.getElementById("historicoLogins");

let userId = null;

// ===========================
// FUNÇÃO: Atualiza nome no menu
// ===========================
function atualizarNomeMenu(nome) {
  const nomeSpan = document.querySelector(".user-name");
  if (nomeSpan) nomeSpan.textContent = nome || "Usuário";
}

// ===========================
// FUNÇÃO: Preencher formulário com dados do Firestore
// ===========================
function preencherFormulario(dados) {
  // Conta
  nomeEl.value = dados.nome || "";
  telefoneEl.value = dados.telefone || "";
  cpfEl.value = dados.cpf || "";
  dataNascimentoEl.value = dados.dataNascimento || "";

  // Privacidade
  visibilidadePerfilEl.checked = dados.privacidade?.perfilPublico || false;
  compartilharAtividadesEl.checked = dados.privacidade?.compartilharAtividades || false;
  ocultarEmailEl.checked = dados.privacidade?.ocultarEmail || false;
  ocultarTelefoneEl.checked = dados.privacidade?.ocultarTelefone || false;

  // Notificações
  notEmailEl.checked = dados.notificacoes?.email || false;
  notPushEl.checked = dados.notificacoes?.push || false;
  notSMSEl.checked = dados.notificacoes?.sms || false;
  notMarketingEl.checked = dados.notificacoes?.marketing || false;

  // Preferências
  idiomaEl.value = dados.preferencias?.idioma || "pt-BR";
  fusoHorarioEl.value = dados.preferencias?.fusoHorario || "GMT-3";
  temaEl.value = dados.preferencias?.tema || "claro";

  // Segurança
  doisFAEl.checked = dados.seguranca?.doisFA || false;

  // Histórico de logins
  historicoEl.innerHTML = "";
  if (dados.seguranca?.historicoLogins) {
    dados.seguranca.historicoLogins.forEach(login => {
      const li = document.createElement("li");
      li.textContent = login;
      historicoEl.appendChild(li);
    });
  }
}

// ===========================
// AUTH + CARREGAR DADOS
// ===========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login/login.html";
    return;
  }

  userId = user.uid;
  emailEl.value = user.email;

  const ref = doc(db, "Usuario", userId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const dados = snap.data();
    preencherFormulario(dados);
    atualizarNomeMenu(dados.nome);
  }
});

// ===========================
// SALVAR ALTERAÇÕES
// ===========================
document.getElementById("perfilForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  mensagemEl.textContent = "";

  try {
    await updateDoc(doc(db, "Usuario", userId), {
      nome: nomeEl.value,
      telefone: telefoneEl.value,
      cpf: cpfEl.value,
      dataNascimento: dataNascimentoEl.value,

      privacidade: {
        perfilPublico: visibilidadePerfilEl.checked,
        compartilharAtividades: compartilharAtividadesEl.checked,
        ocultarEmail: ocultarEmailEl.checked,
        ocultarTelefone: ocultarTelefoneEl.checked
      },

      notificacoes: {
        email: notEmailEl.checked,
        push: notPushEl.checked,
        sms: notSMSEl.checked,
        marketing: notMarketingEl.checked
      },

      preferencias: {
        idioma: idiomaEl.value,
        fusoHorario: fusoHorarioEl.value,
        tema: temaEl.value
      },

      seguranca: {
        doisFA: doisFAEl.checked,
        historicoLogins: arrayUnion(`Alterado em ${new Date().toLocaleString()}`)
      }
    });

    // Atualiza o nome no menu imediatamente
    atualizarNomeMenu(nomeEl.value);

    mensagemEl.textContent = "Alterações salvas com sucesso!";
    mensagemEl.style.color = "green";
  } catch (e) {
    console.error(e);
    mensagemEl.textContent = "Erro ao salvar alterações.";
    mensagemEl.style.color = "red";
  }
});
