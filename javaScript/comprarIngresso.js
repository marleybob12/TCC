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
const qrCodeContainer = document.getElementById("qrCodeContainer"); // Container para exibir o QR Code

let loteSelecionado = null;

/**
 * Carrega os dados do evento selecionado.
 */
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

/**
 * Carrega os lotes (ingressos disponíveis) do evento.
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

      // Gera o QR Code Pix para pagamento
      const qrCodePix = await gerarQrCodePix(lote.preco);
      qrCodeContainer.innerHTML = `<img src="${qrCodePix}" alt="QR Code Pix" style="max-width: 300px; margin-top: 20px;">`;

      msgEl.innerText = "✅ Escaneie o QR Code para realizar o pagamento.";
      msgEl.style.color = "green";

    } catch (err) {
      console.error(err);
      msgEl.innerText = "❌ Erro ao gerar QR Code para pagamento.";
      msgEl.style.color = "red";
    }
  });
});

/**
 * Gera um QR Code Pix para pagamento usando uma API gratuita.
 * @param {number} valor - Valor do ingresso
 * @returns {string} - URL do QR Code gerado
 */
async function gerarQrCodePix(valor) {
  const response = await fetch("https://api.qr-code-pix.com.br/v1/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chave: "sua-chave-pix@exemplo.com", // Substitua pela sua chave Pix
      valor: valor,
      descricao: "Pagamento de ingresso - EventFlow"
    })
  });

  if (!response.ok) {
    throw new Error("Erro ao gerar QR Code Pix.");
  }

  const data = await response.json();
  return data.qrcode_image; // Retorna a URL da imagem do QR Code
}
