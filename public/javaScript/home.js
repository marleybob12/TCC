import { db } from "./firebaseConfig.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, hydrateHeader, renderAppHeader, eventCard, showMessage } from "./ui.js";

renderAppHeader("home");
hydrateHeader();

const state = { eventos: [] };
const eventosEl = $("#eventos");
const buscaEl = $("#busca");
const categoriaEl = $("#categoria");
const cidadeEl = $("#cidade");
const ordemEl = $("#ordem");

function normalizar(texto = "") {
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function preencherFiltros() {
  const categorias = [...new Set(state.eventos.map(({ evento }) => evento.categoria).filter(Boolean))].sort();
  const cidades = [...new Set(state.eventos.map(({ evento }) => evento.cidade || evento.local).filter(Boolean))].sort();
  categoriaEl.innerHTML = '<option value="">Todas categorias</option>' + categorias.map(c => `<option>${c}</option>`).join("");
  cidadeEl.innerHTML = '<option value="">Todas cidades</option>' + cidades.map(c => `<option>${c}</option>`).join("");
}

function render() {
  const termo = normalizar(buscaEl.value);
  const cat = categoriaEl.value;
  const cidade = cidadeEl.value;
  const ordem = ordemEl.value;

  let lista = state.eventos.filter(({ evento }) => {
    const texto = normalizar(`${evento.titulo || ""} ${evento.descricao || ""} ${evento.local || ""} ${evento.cidade || ""}`);
    const okBusca = !termo || texto.includes(termo);
    const okCat = !cat || evento.categoria === cat;
    const okCidade = !cidade || evento.cidade === cidade || evento.local === cidade;
    return okBusca && okCat && okCidade;
  });

  lista.sort((a, b) => {
    if (ordem === "nome") return String(a.evento.titulo || "").localeCompare(String(b.evento.titulo || ""));
    const da = a.evento.dataInicio?.toDate ? a.evento.dataInicio.toDate() : new Date(a.evento.dataInicio || 0);
    const db = b.evento.dataInicio?.toDate ? b.evento.dataInicio.toDate() : new Date(b.evento.dataInicio || 0);
    return da - db;
  });

  if (!lista.length) {
    eventosEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Nenhum evento encontrado com esses filtros.</div>`;
    return;
  }
  eventosEl.innerHTML = lista.map(({ id, evento }) => eventCard(id, evento)).join("");
}

async function carregarEventos() {
  try {
    let snap;
    try {
      snap = await getDocs(query(collection(db, "Evento"), orderBy("dataInicio", "asc")));
    } catch {
      snap = await getDocs(collection(db, "Evento"));
    }
    state.eventos = snap.docs
      .map(doc => ({ id: doc.id, evento: doc.data() }))
      .filter(({ evento }) => !evento.status || evento.status === "publicado" || evento.status === "ativo");
    preencherFiltros();
    render();
  } catch (error) {
    console.error(error);
    showMessage("Não foi possível carregar os eventos. Verifique as regras do Firestore e sua conexão.", "error");
    eventosEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Erro ao carregar eventos.</div>`;
  }
}

[buscaEl, categoriaEl, cidadeEl, ordemEl].forEach(el => el.addEventListener("input", render));
carregarEventos();
