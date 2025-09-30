import { auth, db } from "../javaScript/firebaseConfig.js";
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updatePassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const nomeEl = document.getElementById("nome");
const emailEl = document.getElementById("email");
const telefoneEl = document.getElementById("telefone");
const cpfEl = document.getElementById("cpf");
const dataNascimentoEl = document.getElementById("dataNascimento");
const novaSenhaEl = document.getElementById("novaSenha");
const mensagemEl = document.getElementById("mensagem");

const visibilidadePerfilEl = document.getElementById("visibilidadePerfil");
const compartilharAtividadesEl = document.getElementById("compartilharAtividades");
const ocultarEmailEl = document.getElementById("ocultarEmail");
const ocultarTelefoneEl = document.getElementById("ocultarTelefone");

const notEmailEl = document.getElementById("notEmail");
const notPushEl = document.getElementById("notPush");
const notSMSEl = document.getElementById("notSMS");
const notMarketingEl = document.getElementById("notMarketing");

const idiomaEl = document.getElementById("idioma");
const fusoHorarioEl = document.getElementById("fusoHorario");
const temaEl = document.getElementById("tema");

const doisFAEl = document.getElementById("2fa");
const historicoEl = document.getElementById("historicoLogins");

let userId;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    emailEl.value = user.email;

    const userDoc = await getDoc(doc(db, "Usuario", userId));
    if (userDoc.exists()) {
      const dados = userDoc.data();

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
  } else {
    window.location.href = "../login/login.html";
  }
});

// Salvar alterações
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
        doisFA: doisFAEl.checked
      }
    });

    if (novaSenhaEl.value) {
      await updatePassword(auth.currentUser, novaSenhaEl.value);
    }

    mensagemEl.textContent = "Dados atualizados com sucesso!";
    mensagemEl.style.color = "green";
  } catch (error) {
    mensagemEl.textContent = "Erro ao atualizar dados.";
    mensagemEl.style.color = "red";
    console.error(error);
  }
});

// Excluir conta
document.getElementById("excluirConta").addEventListener("click", () => {
  if (confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) {
    alert("Conta excluída! (Implementar integração com Firebase)");
  }
});

// Accordion
const accordions = document.getElementsByClassName("accordion");
for (let acc of accordions) {
  acc.addEventListener("click", function() {
    this.classList.toggle("active");
    const panel = this.nextElementSibling;
    panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + "px";
  });
};

// Dropdown usuário
const dropdown = document.getElementById("dropdown");
function toggleDropdown() { dropdown.classList.toggle("show"); }
document.getElementById("dropdownLogout").addEventListener("click", () => auth.signOut());
