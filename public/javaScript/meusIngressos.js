import { db } from "./firebaseConfig.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatDate, getCurrentUser, hydrateHeader, money, renderAppHeader } from "./ui.js";

renderAppHeader("ingressos");
hydrateHeader();

const lista = document.getElementById("lista");
const qrUrl = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;

async function carregar() {
  const session = await getCurrentUser({ required: true });
  try {
    const snap = await getDocs(query(collection(db, "Ingresso"), where("usuarioID", "==", session.user.uid)));
    if (snap.empty) {
      lista.innerHTML = `<div class="empty-state">Você ainda não comprou nenhum ingresso. <br><br><a class="btn btn-primary" href="/home/home.html">Explorar eventos</a></div>`;
      return;
    }
    const ingressos = snap.docs.map(doc => ({ id: doc.id, ingresso: doc.data() }));
    ingressos.sort((a,b) => {
      const da = a.ingresso.dataCompra?.toDate ? a.ingresso.dataCompra.toDate() : new Date(0);
      const db = b.ingresso.dataCompra?.toDate ? b.ingresso.dataCompra.toDate() : new Date(0);
      return db - da;
    });
    lista.innerHTML = ingressos.map(({ id, ingresso }) => {
      const status = ingresso.status || "ativo";
      const qrData = ingresso.qrCodeData || `EVENTFLOW:${id}`;
      return `
        <article class="light-card ticket-row">
          <div>
            <span class="status-pill status-${status}">${status.toUpperCase()}</span>
            <h2 style="font-size:1.7rem;color:#111827;margin:12px 0 8px">${ingresso.nomeEvento || "Evento"}</h2>
            <div class="meta-row">🎫 <span>${ingresso.nomeLote || "Ingresso"} • ${money(ingresso.preco)}</span></div>
            <div class="meta-row">🗓️ <span>Compra: ${formatDate(ingresso.dataCompra)}</span></div>
            <div class="meta-row">🔐 <span>Código: <strong>${id}</strong></span></div>
            <p class="helper">Apresente esse código ou QR Code na entrada do evento.</p>
          </div>
          <div class="qr-box"><img src="${qrUrl(qrData)}" alt="QR Code do ingresso"></div>
        </article>
      `;
    }).join("");
  } catch (error) {
    console.error(error);
    lista.innerHTML = `<div class="empty-state">Erro ao carregar seus ingressos.</div>`;
  }
}
carregar();
