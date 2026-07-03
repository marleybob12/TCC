import { db } from "./firebaseConfig.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, formatDate, getCurrentUser, hydrateHeader, money, renderAppHeader, showMessage } from "./ui.js";

renderAppHeader("organizador");
hydrateHeader();

const eventoSelect = $("#eventoSelect");
const resumo = $("#resumo");
const participantes = $("#participantes");
const validarForm = $("#validarForm");
let session = null;
let eventos = [];

async function carregarEventos() {
  session = await getCurrentUser({ required: true });
  const snap = await getDocs(query(collection(db, "Evento"), where("organizadorID", "==", session.user.uid)));
  eventos = snap.docs.map(doc => ({ id: doc.id, evento: doc.data() }));
  if (!eventos.length) {
    eventoSelect.innerHTML = `<option value="">Nenhum evento criado</option>`;
    resumo.innerHTML = `<div class="empty-state">Crie um evento para usar o painel.</div>`;
    return;
  }
  eventoSelect.innerHTML = `<option value="">Selecione</option>` + eventos.map(({ id, evento }) => `<option value="${id}">${evento.titulo || "Evento sem título"}</option>`).join("");
}

async function carregarResumo(eventoID) {
  if (!eventoID) {
    resumo.innerHTML = "";
    participantes.innerHTML = `<div class="empty-state">Selecione um evento.</div>`;
    return;
  }
  const evento = eventos.find(e => e.id === eventoID)?.evento || {};
  const [lotesSnap, ingressosSnap] = await Promise.all([
    getDocs(query(collection(db, "Lote"), where("eventoID", "==", eventoID))),
    getDocs(query(collection(db, "Ingresso"), where("eventoID", "==", eventoID)))
  ]);

  const ingressos = ingressosSnap.docs.map(doc => ({ id: doc.id, ingresso: doc.data() }));
  const receita = ingressos.reduce((s, item) => s + Number(item.ingresso.preco || 0), 0);
  const ativos = ingressos.filter(i => i.ingresso.status === "ativo").length;
  const usados = ingressos.filter(i => i.ingresso.status === "usado").length;

  resumo.innerHTML = `
    <div class="ticket-row"><div><strong>${evento.titulo || "Evento"}</strong><div class="helper">${formatDate(evento.dataInicio)}</div></div><a class="btn btn-ghost" href="/home/evento.html?id=${eventoID}">Ver página</a></div>
    <div class="grid-3" style="gap:10px">
      <div class="light-card" style="padding:14px"><strong>${ingressos.length}</strong><div class="helper">vendidos</div></div>
      <div class="light-card" style="padding:14px"><strong>${ativos}</strong><div class="helper">ativos</div></div>
      <div class="light-card" style="padding:14px"><strong>${money(receita)}</strong><div class="helper">receita</div></div>
    </div>
    <h3>Lotes</h3>
    ${lotesSnap.docs.map(doc => {
      const lote = doc.data();
      return `<div class="ticket-row"><div><strong>${lote.nome}</strong><div class="helper">${money(lote.preco)} • restante: ${Number(lote.quantidade || 0)}</div></div></div>`;
    }).join("") || `<div class="empty-state">Sem lotes cadastrados.</div>`}
  `;

  if (!ingressos.length) {
    participantes.innerHTML = `<div class="empty-state">Nenhum ingresso vendido ainda.</div>`;
    return;
  }

  const linhas = await Promise.all(ingressos.map(async ({ id, ingresso }) => {
    let nome = ingresso.usuarioID;
    try {
      const userSnap = await getDoc(doc(db, "Usuario", ingresso.usuarioID));
      if (userSnap.exists()) nome = userSnap.data().nome || userSnap.data().email || nome;
    } catch {}
    return `<div class="ticket-row"><div><span class="status-pill status-${ingresso.status || "ativo"}">${(ingresso.status || "ativo").toUpperCase()}</span><strong style="display:block;margin-top:8px">${nome}</strong><div class="helper">${ingresso.nomeLote || "Ingresso"} • ${id}</div></div></div>`;
  }));
  participantes.innerHTML = linhas.join("");
}

eventoSelect.addEventListener("change", () => carregarResumo(eventoSelect.value));

validarForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const ingressoID = $("#ingressoID").value.trim();
    const resposta = await fetch("/api/validar-ingresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingressoID, organizadorID: session.user.uid })
    });
    const json = await resposta.json();
    if (!resposta.ok || !json.success) throw new Error(json.message || "Não foi possível validar.");
    showMessage(json.message, "success");
    $("#ingressoID").value = "";
    if (eventoSelect.value) carregarResumo(eventoSelect.value);
  } catch (error) {
    showMessage(error.message, "error");
  }
});

carregarEventos().catch(error => {
  console.error(error);
  eventoSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
});
