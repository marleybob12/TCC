import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, 
  query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Carrega dados do evento
async function carregarEvento() {
  const eventoRef = doc(db, "Evento", eventoID);
  const eventoSnap = await getDoc(eventoRef);

  if (!eventoSnap.exists()) {
    msgEl.innerText = "Evento não encontrado.";
    return;
  }

  const evento = eventoSnap.data();
  tituloEl.textContent = evento.titulo;
  descricaoEl.textContent = evento.descricao;
  dataEl.textContent = new Date(evento.dataInicio.seconds * 1000).toLocaleString();
  bannerEl.src = evento.imagemBanner;

  // Carregar lotes (ingressos disponíveis)
  await carregarLotes();
}

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
        <b>${lote.nome}</b> - R$ ${lote.preco.toFixed(2)} 
        (${disponiveis} disponíveis)
      </label>
    `;

    listaIngressos.appendChild(optionDiv);
  });

  // Escuta seleção de lote
  listaIngressos.querySelectorAll("input[name='lote']").forEach(input => {
    input.addEventListener("change", (e) => {
      loteSelecionado = e.target.value;
    });
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user) return window.location.href = "../login.html";

  carregarEvento();

  btnComprar.addEventListener("click", async () => {
    if (!loteSelecionado) {
      msgEl.innerText = "Selecione um ingresso.";
      msgEl.style.color = "red";
      return;
    }

    try {
      const loteRef = doc(db, "Lote", loteSelecionado);
      const loteSnap = await getDoc(loteRef);

      if (!loteSnap.exists()) {
        msgEl.innerText = "Lote não encontrado.";
        return;
      }

      const lote = loteSnap.data();

      if (lote.quantidade <= 0) {
        msgEl.innerText = "Ingressos esgotados!";
        msgEl.style.color = "red";
        return;
      }

      // Atualiza quantidade
      await updateDoc(loteRef, { quantidade: lote.quantidade - 1 });

      // Cria ingresso
      await addDoc(collection(db, "Ingresso"), {
        usuarioID: user.uid,
        eventoID,
        loteID: loteSelecionado,
        dataCompra: serverTimestamp(),
        status: "ativo"
      });

      msgEl.innerText = "✅ Ingresso comprado com sucesso!";
      msgEl.style.color = "green";
    } catch (err) {
      console.error(err);
      msgEl.innerText = "❌ Erro ao comprar ingresso.";
      msgEl.style.color = "red";
    }
  });
});
