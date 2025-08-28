import { auth, db } from "./firebaseConfig.js";
import { inserirDadosComOrganizador } from "./inserirDados.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elementos do DOM
const form = document.getElementById("formCriarEvento");
const listaIngressos = document.getElementById("listaIngressos");
const addIngressoBtn = document.getElementById("addIngressoBtn");
const mensagemEl = document.getElementById("mensagem");
const btnCriarEvento = document.getElementById("btnCriarEvento");
const loader = document.getElementById("loader");

// Função para adicionar ingresso dinamicamente
function adicionarIngresso(nome = "", preco = "", quantidade = "") {
  const div = document.createElement("div");
  div.classList.add("ingresso-item");
  div.style.marginBottom = "10px";
  div.innerHTML = `
    <input type="text" placeholder="Nome do Ingresso (ex: Pista, VIP)" class="ingresso-nome" value="${nome}" required>
    <input type="number" placeholder="Preço" class="ingresso-preco" min="0" value="${preco}" required>
    <input type="number" placeholder="Quantidade" class="ingresso-quantidade" min="1" value="${quantidade}" required>
    <button type="button" class="remover-btn">❌</button>
  `;
  div.querySelector(".remover-btn").addEventListener("click", () => div.remove());
  listaIngressos.appendChild(div);
}

// Botão para adicionar ingresso
addIngressoBtn.addEventListener("click", () => adicionarIngresso());

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

      try {
        // Captura todos os ingressos criados
        const ingressos = [];
        listaIngressos.querySelectorAll(".ingresso-item").forEach(div => {
          const nome = div.querySelector(".ingresso-nome").value.trim();
          const preco = parseFloat(div.querySelector(".ingresso-preco").value);
          const quantidade = parseInt(div.querySelector(".ingresso-quantidade").value, 10);
          if (nome && !isNaN(preco) && preco >= 0 && !isNaN(quantidade) && quantidade > 0) {
            ingressos.push({ nome, preco, quantidade });
          }
        });

        if (ingressos.length === 0) {
          throw new Error("Adicione pelo menos um tipo de ingresso.");
        }

        const eventoData = {
          nome: document.getElementById("nomeEvento").value.trim(),
          descricao: document.getElementById("descricaoEvento").value.trim(),
          data: document.getElementById("dataEvento").value,
          hora: document.getElementById("horaEvento").value,
          endereco: document.getElementById("enderecoEvento").value.trim(),
          cep: document.getElementById("cepEvento").value.trim(),
          tipo: document.getElementById("tipoEvento").value.trim(),
          cnpj: document.getElementById("cnpjEvento").value.trim() || null,
          bannerUrl: document.getElementById("bannerUrlEvento").value.trim() || "",
          ingressos,
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
        listaIngressos.innerHTML = "";
        setTimeout(() => window.location.href = "meusEventos.html", 1500);
      } catch (error) {
        console.error("Erro ao criar evento:", error);
        mensagemEl.textContent = "❌ " + error.message;
        mensagemEl.style.color = "red";
      } finally {
        btnCriarEvento.disabled = false;
        loader.style.display = "none";
      }
    });
  }
});
