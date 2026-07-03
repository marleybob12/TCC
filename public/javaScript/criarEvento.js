import { db } from "./firebaseConfig.js";
import { addDoc, collection, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, dateInputValue, getCurrentUser, hydrateHeader, renderAppHeader, showMessage } from "./ui.js";

renderAppHeader("criar");
hydrateHeader();

const form = $("#eventoForm");
const lotesEl = $("#lotes");
const addLoteBtn = $("#addLote");
let loteIndex = 0;

function loteTemplate() {
  loteIndex += 1;
  const agora = new Date();
  const fim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const div = document.createElement("div");
  div.className = "lote-item";
  div.innerHTML = `
    <button class="btn btn-danger btn-small remove-lote" type="button">Remover</button>
    <div class="form-grid">
      <div class="form-row"><label>Nome do lote</label><input class="lote-nome" required value="Ingresso Geral"></div>
      <div class="form-row"><label>Preço</label><input class="lote-preco" type="number" min="0" step="0.01" required placeholder="0.00"></div>
      <div class="form-row"><label>Quantidade</label><input class="lote-quantidade" type="number" min="1" required value="100"></div>
      <div class="form-row"><label>Início da venda</label><input class="lote-inicio" type="datetime-local" required value="${dateInputValue(agora)}"></div>
      <div class="form-row"><label>Fim da venda</label><input class="lote-fim" type="datetime-local" required value="${dateInputValue(fim)}"></div>
    </div>
  `;
  div.querySelector(".remove-lote").addEventListener("click", () => div.remove());
  lotesEl.appendChild(div);
}

function lerLotes() {
  const itens = [...lotesEl.querySelectorAll(".lote-item")];
  if (!itens.length) throw new Error("Adicione pelo menos um lote de ingresso.");
  return itens.map((item, index) => {
    const nome = item.querySelector(".lote-nome").value.trim();
    const preco = Number(item.querySelector(".lote-preco").value);
    const quantidade = Number(item.querySelector(".lote-quantidade").value);
    const inicio = new Date(item.querySelector(".lote-inicio").value);
    const fim = new Date(item.querySelector(".lote-fim").value);
    if (!nome) throw new Error(`Informe o nome do lote ${index + 1}.`);
    if (Number.isNaN(preco) || preco < 0) throw new Error(`Preço inválido no lote ${index + 1}.`);
    if (!Number.isInteger(quantidade) || quantidade < 1) throw new Error(`Quantidade inválida no lote ${index + 1}.`);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) throw new Error(`Datas de venda inválidas no lote ${index + 1}.`);
    return { nome, preco, quantidade, quantidadeInicial: quantidade, dataInicioVenda: Timestamp.fromDate(inicio), dataFimVenda: Timestamp.fromDate(fim) };
  });
}

addLoteBtn.addEventListener("click", loteTemplate);
loteTemplate();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  submit.textContent = "Publicando...";

  try {
    const session = await getCurrentUser({ required: true });
    const dataEvento = new Date($("#dataInicio").value);
    if (Number.isNaN(dataEvento.getTime())) throw new Error("Informe uma data válida para o evento.");
    const lotes = lerLotes();

    const eventoRef = await addDoc(collection(db, "Evento"), {
      titulo: $("#titulo").value.trim(),
      descricao: $("#descricao").value.trim(),
      categoria: $("#categoria").value,
      dataInicio: Timestamp.fromDate(dataEvento),
      cidade: $("#cidade").value.trim(),
      local: $("#local").value.trim(),
      cep: $("#cep").value.trim(),
      endereco: $("#endereco").value.trim(),
      imagemBanner: $("#imagemBanner").value.trim(),
      status: "publicado",
      organizadorID: session.user.uid,
      organizadorNome: session.profile.nome || session.user.email,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });

    await Promise.all(lotes.map(lote => addDoc(collection(db, "Lote"), {
      ...lote,
      eventoID: eventoRef.id,
      organizadorID: session.user.uid,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    })));

    showMessage("Evento publicado com sucesso.", "success");
    setTimeout(() => window.location.href = `/home/evento.html?id=${eventoRef.id}`, 900);
  } catch (error) {
    console.error(error);
    showMessage(error.message, "error");
  } finally {
    submit.disabled = false;
    submit.textContent = "Publicar evento";
  }
});
