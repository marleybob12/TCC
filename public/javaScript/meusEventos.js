import { db } from "./firebaseConfig.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getCurrentUser, hydrateHeader, renderAppHeader, eventCard } from "./ui.js";

renderAppHeader("organizador");
hydrateHeader();

const lista = document.getElementById("lista");

async function carregar() {
  const session = await getCurrentUser({ required: true });
  try {
    const snap = await getDocs(query(collection(db, "Evento"), where("organizadorID", "==", session.user.uid)));
    if (snap.empty) {
      lista.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Você ainda não criou eventos. <br><br><a class="btn btn-primary" href="/home/criarEvento.html">Criar primeiro evento</a></div>`;
      return;
    }
    const eventos = snap.docs.map(doc => ({ id: doc.id, evento: doc.data() }));
    eventos.sort((a,b) => String(a.evento.titulo || "").localeCompare(String(b.evento.titulo || "")));
    lista.innerHTML = eventos.map(({ id, evento }) => eventCard(id, evento)).join("");
  } catch (error) {
    console.error(error);
    lista.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Erro ao carregar seus eventos.</div>`;
  }
}
carregar();
