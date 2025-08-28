import { auth, db } from "./firebaseConfig.js";
import { inserirDadosComOrganizador } from "./inserirDados.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elementos do DOM
const form = document.getElementById("formCriarEvento");
const bannerUrlInput = document.getElementById("bannerUrlEvento");
const previewBannerUrl = document.getElementById("previewBannerUrl");
const mensagemEl = document.getElementById("mensagem");
const btnCriarEvento = document.getElementById("btnCriarEvento");
const loader = document.getElementById("loader");

// Preview da URL do banner
if (bannerUrlInput) {
  bannerUrlInput.addEventListener("input", () => {
    const url = bannerUrlInput.value.trim();
    if (url) {
      previewBannerUrl.src = url;
      previewBannerUrl.style.display = "block";
    } else {
      previewBannerUrl.style.display = "none";
    }
  });
}

// Função para alternar dropdown
window.toggleDropdown = function() {
  const menu = document.getElementById("dropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
};

// Fechar dropdown ao clicar fora
window.addEventListener("click", function (e) {
  const dropdown = document.getElementById("dropdown");
  const account = document.querySelector(".user-account");
  if (!account.contains(e.target)) dropdown.style.display = "none";
});

// Menu mobile
document.getElementById("menu-icon").addEventListener("click", () => {
  document.querySelector("header nav ul").classList.toggle("show");
});

// Verifica login do usuário
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../login.html";

  try {
    const userDoc = await getDoc(doc(db, "Usuario", user.uid));
    if (userDoc.exists()) {
      const dados = userDoc.data();
      document.querySelector(".user-name").textContent = dados.nome || "Usuário";
      document.getElementById("nomeUsuario").value = dados.nome || "";
      document.getElementById("cpfUsuario").value = dados.cpf || "";
      document.getElementById("telefoneUsuario").value = dados.telefone || "";
      document.getElementById("dataNascimentoUsuario").value = dados.dataNascimento || "";
    }
  } catch (e) {
    console.error("Erro ao buscar dados do usuário:", e);
    mensagemEl.textContent = "❌ Erro ao carregar dados do usuário.";
    mensagemEl.style.color = "red";
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      mensagemEl.textContent = "";
      btnCriarEvento.disabled = true;
      loader.style.display = "block";

      // Valida campos obrigatórios
      const camposObrigatorios = [
        { id: "nomeEvento", msg: "Nome do evento é obrigatório." },
        { id: "descricaoEvento", msg: "Descrição do evento é obrigatória." },
        { id: "dataEvento", msg: "Data do evento é obrigatória." },
        { id: "horaEvento", msg: "Hora do evento é obrigatória." },
        { id: "enderecoEvento", msg: "Endereço do evento é obrigatório." },
        { id: "tipoEvento", msg: "Categoria do evento é obrigatória." },
      ];
      for (const campo of camposObrigatorios) {
        const el = document.getElementById(campo.id);
        if (!el || !el.value.trim()) {
          mostrarErro(campo.msg);
          return;
        }
      }

      // Validar CEP, quantidade e preço
      const cep = document.getElementById("cepEvento").value.trim();
      if (!cep) return mostrarErro("CEP é obrigatório.");
      const quantidade = parseInt(document.getElementById("quantidadeEvento").value, 10);
      if (isNaN(quantidade) || quantidade < 1) return mostrarErro("A quantidade de ingressos deve ser pelo menos 1.");
      const preco = parseFloat(document.getElementById("precoEvento").value);
      if (isNaN(preco) || preco < 0) return mostrarErro("O preço do ingresso não pode ser negativo.");

      try {
        const bannerUrl = bannerUrlInput.value.trim() || ""; // pega a URL do input

        const eventoData = {
          nome: document.getElementById("nomeEvento").value.trim(),
          descricao: document.getElementById("descricaoEvento").value.trim(),
          data: document.getElementById("dataEvento").value,
          hora: document.getElementById("horaEvento").value,
          preco,
          quantidade,
          endereco: document.getElementById("enderecoEvento").value.trim(),
          cep,
          tipo: document.getElementById("tipoEvento").value.trim(),
          cnpj: document.getElementById("cnpjEvento").value.trim() || null,
          bannerUrl,
          dataCriacao: new Date()
        };

        await inserirDadosComOrganizador(
          db,
          auth.currentUser.uid,
          document.getElementById("nomeUsuario").value,
          auth.currentUser.email,
          document.getElementById("telefoneUsuario").value,
          document.getElementById("cpfUsuario").value,
          document.getElementById("dataNascimentoUsuario").value,
          eventoData
        );

        mensagemEl.textContent = "✅ Evento criado com sucesso!";
        mensagemEl.style.color = "#2F78E3";
        form.reset();
        previewBannerUrl.style.display = "none";
        setTimeout(() => window.location.href = "meusEventos.html", 1200);
      } catch (error) {
        console.error("Erro ao criar evento:", error);
        mostrarErro(error.message.includes("PERMISSION_DENIED")
          ? "❌ Permissão negada no Firestore. Verifique suas regras."
          : "❌ Erro ao criar evento.");
      } finally {
        btnCriarEvento.disabled = false;
        loader.style.display = "none";
      }
    });
  }
});

// Função de erro
function mostrarErro(msg) {
  mensagemEl.textContent = msg;
  mensagemEl.style.color = "red";
  btnCriarEvento.disabled = false;
  loader.style.display = "none";
}
