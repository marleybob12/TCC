import { auth, db } from "./firebaseConfig.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const BACKEND_URL = 'https://tcc-puce-three.vercel.app/api'; // corrigido para /api
const params = new URLSearchParams(window.location.search);
const eventoID = params.get("id");

const titulo = document.getElementById("tituloEvento");
const banner = document.getElementById("bannerEvento");
const descricao = document.getElementById("descricaoEvento");
const dataEvento = document.getElementById("dataEvento");
const listaIngressos = document.getElementById("listaIngressos");

let usuarioAtual = null;

// Formata datas do Firestore
function formatDate(timestamp) {
  if (!timestamp) return "A definir";
  if (timestamp.toDate) return timestamp.toDate().toLocaleDateString("pt-BR");
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

// Carrega evento e lotes
async function carregarEvento() {
  try {
    if (!eventoID) return listaIngressos.innerHTML = "<p class='error'>ID do evento não encontrado.</p>";

    const eventoDoc = await getDoc(doc(db, "Evento", eventoID));
    if (!eventoDoc.exists()) return listaIngressos.innerHTML = "<p class='error'>Evento não encontrado.</p>";

    const evento = eventoDoc.data();
    titulo.textContent = evento.titulo || "Evento";
    banner.src = evento.imagemBanner || "../img/evento.jpg";
    banner.alt = evento.titulo || "Banner do Evento";
    descricao.textContent = evento.descricao || "Sem descrição disponível";
    dataEvento.textContent = formatDate(evento.dataInicio);

    const lotesSnap = await getDocs(query(collection(db, "Lote"), where("eventoID", "==", eventoID)));
    if (lotesSnap.empty) return listaIngressos.innerHTML = "<p>Nenhum ingresso disponível no momento.</p>";

    listaIngressos.innerHTML = "";
    lotesSnap.forEach(loteDoc => {
      const lote = loteDoc.data();
      const disponivel = lote.quantidade > 0;
      const div = document.createElement("div");
      div.classList.add("lote-card");
      div.innerHTML = `
        <h3>${lote.nome}</h3>
        <p><b>Preço:</b> R$ ${lote.preco.toFixed(2)}</p>
        <p><b>Disponível:</b> <span class="qtdIngressos">${lote.quantidade}</span> ${lote.quantidade === 1 ? 'ingresso' : 'ingressos'}</p>
        <button class="btnComprar" data-lote="${loteDoc.id}" data-evento="${eventoID}" ${!disponivel ? 'disabled' : ''}>
          ${disponivel ? '🎟️ Comprar' : '❌ Esgotado'}
        </button>
      `;
      listaIngressos.appendChild(div);
    });

    adicionarEventosCompra();

  } catch (err) {
    console.error("Erro ao carregar evento:", err);
    listaIngressos.innerHTML = "<p class='error'>Erro ao carregar o evento. Tente novamente.</p>";
  }
}

// Botões de compra
function adicionarEventosCompra() {
  document.querySelectorAll(".btnComprar").forEach(btn => {
    btn.addEventListener("click", async e => {
      const button = e.target;
      const loteID = button.dataset.lote;
      const eventoIDCompra = button.dataset.evento;

      if (!usuarioAtual) {
        alert("Você precisa estar logado para comprar ingressos.");
        window.location.href = "../login.html";
        return;
      }

      button.disabled = true;
      button.textContent = "⏳ Processando...";

      try {
        const result = await comprarIngresso(eventoIDCompra, loteID);
        if (result.success) {
          button.textContent = "✅ Comprado!";
          button.classList.add("sucesso");

          const qtdSpan = button.parentElement.querySelector(".qtdIngressos");
          let qtd = parseInt(qtdSpan.textContent);
          qtd = Math.max(qtd - 1, 0);
          qtdSpan.textContent = qtd;
          if (qtd === 0) button.textContent = "❌ Esgotado";
        }
      } catch (error) {
        console.error("Erro na compra:", error);
        alert("Erro ao processar compra: " + error.message);
        button.disabled = false;
        button.textContent = "🎟️ Comprar";
      }
    });
  });
}

// Compra
async function comprarIngresso(eventoID, loteID) {
  const response = await fetch(`${BACKEND_URL}/comprar-ingresso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuarioID: usuarioAtual.uid, eventoID, loteID }),
  });

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Erro ao processar compra");
    return result;
  } else {
    const text = await response.text();
    throw new Error("Resposta inválida do servidor: " + text);
  }
}

// Observa usuário
onAuthStateChanged(auth, (user) => {
  usuarioAtual = user;
  if (!user) document.querySelectorAll(".btnComprar").forEach(btn => btn.disabled = true);
});

// Inicializa
carregarEvento();
