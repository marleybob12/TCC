import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const eventoID = params.get("id");

const tituloEl = document.getElementById("tituloEvento");
const descricaoEl = document.getElementById("descricaoEvento");
const dataEl = document.getElementById("dataEvento");
const bannerEl = document.getElementById("bannerEvento");
const listaIngressos = document.getElementById("listaIngressos");
const msgEl = document.getElementById("mensagem");
const btnComprar = document.getElementById("comprarBtn");

let loteSelecionado = null;

/**
 * Carrega os dados do evento.
 */
async function carregarEvento() {
  const eventoRef = doc(db, "Evento", eventoID);
  const eventoSnap = await getDoc(eventoRef);
  if (!eventoSnap.exists) {
    msgEl.innerText = "Evento não encontrado.";
    return;
  }

  const evento = eventoSnap.data();
  tituloEl.textContent = evento.titulo;
  descricaoEl.textContent = evento.descricao;
  dataEl.textContent = new Date(evento.dataInicio.seconds * 1000).toLocaleString();
  bannerEl.src = evento.imagemBanner;

  await carregarLotes();
}

/**
 * Carrega os lotes disponíveis do evento.
 */
async function carregarLotes() {
  const q = query(collection(db, "Lote"), where("eventoID", "==", eventoID));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    listaIngressos.innerHTML = "<p>Nenhum ingresso disponível.</p>";
    return;
  }

  listaIngressos.innerHTML = "";

  querySnap.forEach((loteDoc) => {
    const lote = loteDoc.data();
    const disponiveis = lote.quantidade;

    const optionDiv = document.createElement("div");
    optionDiv.classList.add("lote-item");
    optionDiv.style.margin = "10px 0";
    optionDiv.innerHTML = `
      <label>
        <input type="radio" name="lote" value="${loteDoc.id}">
        <b>${lote.nome}</b> - R$ ${lote.preco.toFixed(2)} (${disponiveis} disponíveis)
      </label>
    `;

    listaIngressos.appendChild(optionDiv);
  });

  listaIngressos.querySelectorAll("input[name='lote']").forEach(input => {
    input.addEventListener("change", (e) => {
      loteSelecionado = e.target.value;
    });
  });
}

/**
 * Função para comprar ingresso e enviar e-mail automaticamente.
 */
async function comprarIngresso(usuarioID) {
  if (!loteSelecionado) {
    msgEl.innerText = "Selecione um ingresso.";
    msgEl.style.color = "red";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/enviar-ingresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventoID,
        usuarioID,
        loteID: loteSelecionado
      })
    });

    const text = await response.text();
    msgEl.innerText = "✅ Ingresso reservado e enviado por e-mail!";
    msgEl.style.color = "green";
    alert(text); // mensagem de sucesso do backend
  } catch (err) {
    console.error(err);
    msgEl.innerText = "Erro ao comprar ou enviar ingresso.";
    msgEl.style.color = "red";
  }
}

/**
 * Inicializa a página com autenticação do usuário.
 */
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../login.html";

  await carregarEvento();

  btnComprar.addEventListener("click", () => comprarIngresso(user.uid));
});
