import { db } from "./firebaseConfig.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, cover, formatDate, getCurrentUser, getParam, hydrateHeader, money, renderAppHeader, showMessage } from "./ui.js";

renderAppHeader("home");
hydrateHeader();

const eventoID = getParam("id");
const detalheEl = $("#eventoDetalhe");
let eventoAtual = null;
let lotes = [];

function loteDisponivel(lote) {
  const agora = Date.now();
  const qtd = Number(lote.quantidade || 0);
  const inicio = lote.dataInicioVenda?.toDate ? lote.dataInicioVenda.toDate().getTime() : new Date(lote.dataInicioVenda || 0).getTime();
  const fim = lote.dataFimVenda?.toDate ? lote.dataFimVenda.toDate().getTime() : new Date(lote.dataFimVenda || "2999-01-01").getTime();
  return qtd > 0 && (!inicio || agora >= inicio) && (!fim || agora <= fim);
}

function render() {
  detalheEl.innerHTML = `
    <div class="grid-2" style="align-items:start">
      <div>
        <div class="event-cover" style="height:360px;border-radius:24px;background-image:url('${cover(eventoAtual.imagemBanner)}')"></div>
      </div>
      <div>
        <span class="status-pill status-ativo">${eventoAtual.categoria || "Evento"}</span>
        <h1 style="font-size:clamp(2rem,4vw,3.6rem);color:#111827;margin:16px 0 12px">${eventoAtual.titulo || "Evento"}</h1>
        <p class="helper" style="font-size:1.02rem">${eventoAtual.descricao || "Sem descrição."}</p>
        <div class="list-stack" style="margin:18px 0">
          <div class="meta-row">🗓️ <span>${formatDate(eventoAtual.dataInicio)}</span></div>
          <div class="meta-row">📍 <span>${eventoAtual.local || eventoAtual.cidade || "Local a definir"}</span></div>
          <div class="meta-row">🧭 <span>${eventoAtual.endereco || "Endereço a definir"}</span></div>
        </div>
        <h3>Ingressos disponíveis</h3>
        <div class="ticket-list">
          ${lotes.length ? lotes.map(({ id, lote }) => `
            <div class="ticket-row">
              <div>
                <strong>${lote.nome || "Ingresso"}</strong>
                <div class="helper">${money(lote.preco)} • ${Number(lote.quantidade || 0)} disponível(is)</div>
                <div class="helper">Venda: ${formatDate(lote.dataInicioVenda)} até ${formatDate(lote.dataFimVenda)}</div>
              </div>
              <button class="btn ${loteDisponivel(lote) ? "btn-primary" : "btn-ghost"}" data-comprar="${id}" ${loteDisponivel(lote) ? "" : "disabled"}>${loteDisponivel(lote) ? "Comprar" : "Indisponível"}</button>
            </div>
          `).join("") : `<div class="empty-state">Nenhum lote cadastrado para este evento.</div>`}
        </div>
      </div>
    </div>
  `;

  detalheEl.querySelectorAll("[data-comprar]").forEach(btn => btn.addEventListener("click", comprarIngresso));
}

async function comprarIngresso(event) {
  const loteID = event.currentTarget.dataset.comprar;
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = "Processando...";
  try {
    const session = await getCurrentUser({ required: true });
    const resposta = await fetch("/api/comprar-ingresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioID: session.user.uid, eventoID, loteID })
    });
    const json = await resposta.json();
    if (!resposta.ok || !json.success) throw new Error(json.message || "Erro ao comprar ingresso.");
    showMessage(json.message, "success");
    setTimeout(() => window.location.href = "/home/meusIngressos.html", 900);
  } catch (error) {
    showMessage(error.message, "error");
    event.currentTarget.disabled = false;
    event.currentTarget.textContent = "Comprar";
  }
}

async function carregar() {
  if (!eventoID) {
    detalheEl.innerHTML = `<div class="empty-state">Evento não informado.</div>`;
    return;
  }

  try {
    const eventoSnap = await getDoc(doc(db, "Evento", eventoID));
    if (!eventoSnap.exists()) {
      detalheEl.innerHTML = `<div class="empty-state">Evento não encontrado.</div>`;
      return;
    }
    eventoAtual = eventoSnap.data();
    const loteSnap = await getDocs(query(collection(db, "Lote"), where("eventoID", "==", eventoID)));
    lotes = loteSnap.docs.map(doc => ({ id: doc.id, lote: doc.data() }));
    lotes.sort((a, b) => Number(a.lote.preco || 0) - Number(b.lote.preco || 0));
    render();
  } catch (error) {
    console.error(error);
    detalheEl.innerHTML = `<div class="empty-state">Erro ao carregar evento.</div>`;
  }
}

carregar();
