import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, query, where, getDocs, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Importa bibliotecas externas
import jsPDF from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";

const lista = document.getElementById("listaMeusIngressos");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../login.html";

  try {
    // busca ingressos do usuário
    const q = query(collection(db, "Ingresso"), where("usuarioID", "==", user.uid));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      lista.innerHTML = "<p>Você ainda não possui ingressos.</p>";
      return;
    }

    // primeiro: construir lista de eventos únicos a partir dos ingressos
    const eventoIDs = new Set();
    querySnap.forEach(doc => eventoIDs.add(doc.data().eventoID));

    // container para eventos
    let html = "<h2>Eventos que você participa</h2>";
    html += '<div id="meusEventosParticipando" style="display:flex; flex-direction:column;"></div>';
    html += "<hr />";
    html += "<h2>Seus ingressos</h2>";
    html += '<div id="listaTicketsDetalhados"></div>';

    lista.innerHTML = html;

    const eventosContainer = document.getElementById("meusEventosParticipando");
    const listaTicketsDetalhados = document.getElementById("listaTicketsDetalhados");

    // popular cartões de eventos
    for (const eventoID of eventoIDs) {
      const eventoRef = doc(db, "Evento", eventoID);
      const eventoSnap = await getDoc(eventoRef);
      const evento = eventoSnap.exists() ? eventoSnap.data() : {};

      const card = document.createElement("div");
      card.className = "card-glass";
      card.style.margin = "8px 0";
      card.style.padding = "12px";
      card.innerHTML = `
        <h3>${evento.titulo || "Evento Desconhecido"}</h3>
        <p><b>Data:</b> ${evento.dataInicio ? new Date(evento.dataInicio.seconds * 1000).toLocaleDateString() : "A definir"}</p>
        <p><b>Status:</b> ${evento.status || "A definir"}</p>
        <a class="btn" href="evento.html?id=${eventoID}">🔍 Ver Detalhes</a>
      `;
      eventosContainer.appendChild(card);
    }

    // Em seguida, lista detalhada dos ingressos (mantendo funcionalidade existente)
    for (const ingressoDoc of querySnap.docs) {
      const ingresso = ingressoDoc.data();
      const ingressoID = ingressoDoc.id;

      // Buscar dados do evento
      const eventoRef = doc(db, "Evento", ingresso.eventoID);
      const eventoSnap = await getDoc(eventoRef);

      // Buscar dados do lote
      const loteRef = doc(db, "Lote", ingresso.loteID);
      const loteSnap = await getDoc(loteRef);

      const evento = eventoSnap.exists() ? eventoSnap.data() : {};
      const lote = loteSnap.exists() ? loteSnap.data() : {};

      const div = document.createElement("div");
      div.classList.add("ingresso-card");
      div.style.border = "1px solid #ccc";
      div.style.borderRadius = "10px";
      div.style.padding = "15px";
      div.style.margin = "10px 0";

      div.innerHTML = `
        <h3>${evento.titulo || "Evento Desconhecido"}</h3>
        <p><b>Ingresso:</b> ${lote.nome || "Lote desconhecido"}</p>
        <p><b>Preço:</b> R$ ${lote.preco ? lote.preco.toFixed(2) : "?"}</p>
        <p><b>Status:</b> ${ingresso.status || "ativo"}</p>
        <button class="btnPDF">📄 Baixar PDF</button>
      `;

      // Botão para gerar PDF
      div.querySelector(".btnPDF").addEventListener("click", () => {
        gerarPDF(user, evento, lote, ingresso, ingressoID);
      });

      listaTicketsDetalhados.appendChild(div);
    }

  } catch (err) {
    console.error(err);
    lista.innerHTML = "<p>❌ Erro ao carregar ingressos. Tente novamente mais tarde.</p>";
  }
});

/**
 * Gera um PDF com os dados do ingresso e um QR Code.
 * @param {object} user - Dados do usuário autenticado
 * @param {object} evento - Dados do evento
 * @param {object} lote - Dados do lote do ingresso
 * @param {object} ingresso - Dados do ingresso
 * @param {string} ingressoID - ID do ingresso
 */
async function gerarPDF(user, evento, lote, ingresso, ingressoID) {
  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF();

  // Gera QR Code com ID do ingresso
  const qrData = `IngressoID:${ingressoID}|Usuario:${user.uid}|Evento:${ingresso.eventoID}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);

  // Cabeçalho
  docPDF.setFontSize(18);
  docPDF.text("🎟 Ingresso EventFlow", 20, 20);

  // Dados principais
  docPDF.setFontSize(12);
  docPDF.text(`Nome: ${user.displayName || "Usuário"}`, 20, 40);
  docPDF.text(`Evento: ${evento.titulo || "Evento Desconhecido"}`, 20, 50);
  docPDF.text(`Ingresso: ${lote.nome || "Lote Desconhecido"}`, 20, 60);
  docPDF.text(`Preço: R$ ${lote.preco ? lote.preco.toFixed(2) : "?"}`, 20, 70);
  docPDF.text(`Status: ${ingresso.status || "ativo"}`, 20, 80);
  docPDF.text(`Data da Compra: ${ingresso.dataCompra?.toDate?.().toLocaleString() || "-"}`, 20, 90);

  // QR Code
  docPDF.addImage(qrCodeDataURL, "PNG", 20, 110, 60, 60);

  // Rodapé
  docPDF.setFontSize(10);
  docPDF.text("Apresente este ingresso com QR Code na entrada do evento.", 20, 180);

  // Download
  const safeEventoName = (evento.titulo || "evento").replace(/[^\w\d-_ ]/g, "");
  const safeLoteName = (lote.nome || "lote").replace(/[^\w\d-_ ]/g, "");
  docPDF.save(`Ingresso_${safeEventoName}_${safeLoteName}.pdf`);
}
