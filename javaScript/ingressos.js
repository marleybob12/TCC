import { auth, db } from "../javaScript/firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import jsPDF from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";

// Configurações
const listaIngressosContainer = document.getElementById("listaMeusIngressos");
const listaLotesContainer = document.getElementById("listaIngressos");
const msgEl = document.getElementById("mensagem");
const btnComprar = document.getElementById("comprarBtn");
const params = new URLSearchParams(window.location.search);
const eventoID = params.get("id");
let loteSelecionado = null;

// Autenticação e carregamento inicial
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../login.html";

  // Atualiza nome do usuário no menu
  try {
    const userDoc = await getDoc(doc(db, "Usuario", user.uid));
    if (userDoc.exists()) {
      document.querySelector(".user-name").textContent = userDoc.data().nome || "Usuário";
    }
  } catch (err) {
    console.error("Erro ao carregar nome do usuário:", err);
  }

  // Se estiver em meusIngressos.html
  if (listaIngressosContainer) await exibirIngressos(user);

  // Se estiver em evento.html
  if (listaLotesContainer && btnComprar) {
    await carregarEvento();
    btnComprar.addEventListener("click", () => comprarIngresso(user.uid));
  }
});

// Exibir ingressos do usuário
async function exibirIngressos(user) {
  try {
    const q = query(collection(db, "Ingresso"), where("usuarioID", "==", user.uid));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      listaIngressosContainer.innerHTML = "<p>Você ainda não possui ingressos.</p>";
      return;
    }

    listaIngressosContainer.innerHTML = "";
    for (const ingressoDoc of querySnap.docs) {
      const ingresso = ingressoDoc.data();
      const ingressoID = ingressoDoc.id;

      const eventoSnap = await getDoc(doc(db, "Evento", ingresso.eventoID));
      const evento = eventoSnap.exists() ? eventoSnap.data() : {};

      const loteSnap = await getDoc(doc(db, "Lote", ingresso.loteID));
      const lote = loteSnap.exists() ? loteSnap.data() : {};

      const div = document.createElement("div");
      div.classList.add("ingresso-card");
      div.innerHTML = `
        <h3>${evento.titulo || "Evento Desconhecido"}</h3>
        <p><b>Ingresso:</b> ${lote.nome || "Lote Desconhecido"}</p>
        <p><b>Preço:</b> R$ ${lote.preco ? lote.preco.toFixed(2) : "?"}</p>
        <p><b>Status:</b> ${ingresso.status || "ativo"}</p>
        <button class="btnPDF">📄 Baixar PDF</button>
      `;

      div.querySelector(".btnPDF").addEventListener("click", () =>
        gerarPDF(user, evento, lote, ingresso, ingressoID)
      );

      listaIngressosContainer.appendChild(div);
    }
  } catch (err) {
    console.error(err);
    listaIngressosContainer.innerHTML = "<p>❌ Erro ao carregar ingressos.</p>";
  }
}

// Carregar evento e lotes
async function carregarEvento() {
  const eventoSnap = await getDoc(doc(db, "Evento", eventoID));
  if (!eventoSnap.exists()) {
    msgEl.innerText = "Evento não encontrado.";
    return;
  }

  const evento = eventoSnap.data();
  document.getElementById("tituloEvento").textContent = evento.titulo;
  document.getElementById("descricaoEvento").textContent = evento.descricao;
  document.getElementById("dataEvento").textContent = new Date(evento.dataInicio.seconds * 1000).toLocaleString();
  document.getElementById("bannerEvento").src = evento.imagemBanner;

  await carregarLotes();
}

async function carregarLotes() {
  const q = query(collection(db, "Lote"), where("eventoID", "==", eventoID));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    listaLotesContainer.innerHTML = "<p>Nenhum ingresso disponível.</p>";
    return;
  }

  listaLotesContainer.innerHTML = "";
  querySnap.forEach(loteDoc => {
    const lote = loteDoc.data();
    const optionDiv = document.createElement("div");
    optionDiv.classList.add("lote-item");
    optionDiv.innerHTML = `
      <label>
        <input type="radio" name="lote" value="${loteDoc.id}">
        <b>${lote.nome}</b> - R$ ${lote.preco.toFixed(2)} (${lote.quantidade} disponíveis)
      </label>
    `;
    listaLotesContainer.appendChild(optionDiv);
  });

  listaLotesContainer.querySelectorAll("input[name='lote']").forEach(input => {
    input.addEventListener("change", e => loteSelecionado = e.target.value);
  });
}

// Comprar ingresso
async function comprarIngresso(usuarioID) {
  if (!loteSelecionado) {
    msgEl.innerText = "Selecione um ingresso.";
    msgEl.style.color = "red";
    return;
  }

  try {
    const response = await fetch("https://<SEU_PROJETO>.cloudfunctions.net/enviarIngresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventoID, usuarioID, loteID: loteSelecionado })
    });

    const text = await response.text();
    msgEl.innerText = "✅ Ingresso reservado e enviado por e-mail!";
    msgEl.style.color = "green";
    alert(text);
  } catch (err) {
    console.error(err);
    msgEl.innerText = "Erro ao comprar ou enviar ingresso.";
    msgEl.style.color = "red";
  }
}

// Gerar PDF + QR
async function gerarPDF(user, evento, lote, ingresso, ingressoID) {
  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF();

  const qrData = `IngressoID:${ingressoID}|Usuario:${user.uid}|Evento:${ingresso.eventoID}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);

  docPDF.setFontSize(18);
  docPDF.text("🎟 Ingresso EventFlow", 20, 20);
  docPDF.setFontSize(12);
  docPDF.text(`Nome: ${user.displayName || document.querySelector(".user-name").textContent}`, 20, 40);
  docPDF.text(`Evento: ${evento.titulo || "Evento Desconhecido"}`, 20, 50);
  docPDF.text(`Ingresso: ${lote.nome || "Lote Desconhecido"}`, 20, 60);
  docPDF.text(`Preço: R$ ${lote.preco ? lote.preco.toFixed(2) : "?"}`, 20, 70);
  docPDF.text(`Status: ${ingresso.status || "ativo"}`, 20, 80);
  docPDF.text(`Data da Compra: ${ingresso.dataCompra?.toDate?.().toLocaleString() || "-"}`, 20, 90);

  docPDF.addImage(qrCodeDataURL, "PNG", 20, 110, 60, 60);
  docPDF.setFontSize(10);
  docPDF.text("Apresente este ingresso com QR Code na entrada do evento.", 20, 180);

  const safeEventoName = (evento.titulo || "evento").replace(/[^\w\d-_ ]/g, "");
  const safeLoteName = (lote.nome || "lote").replace(/[^\w\d-_ ]/g, "");
  docPDF.save(`Ingresso_${safeEventoName}_${safeLoteName}.pdf`);
}
