import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======= Variáveis =======
const eventoSelect = document.getElementById("eventoSelect");
const eventoSelectRelatorio = document.getElementById("eventoSelectorRelatorio");
const tabs = document.querySelector(".tabs");
const tabContents = document.querySelectorAll(".tab-content");
const listaParticipantes = document.getElementById("listaParticipantes");
const buscarParticipante = document.getElementById("buscarParticipante");
const statusEl = document.getElementById("status");
const listaHistorico = document.getElementById("listaHistorico");
const relatoriosContainer = document.getElementById("relatoriosContainer");

const eventoActions = document.getElementById("eventoActions");
const btnEditarEvento = document.getElementById("btnEditarEvento");
const btnExcluirEvento = document.getElementById("btnExcluirEvento");
const btnVerVendas = document.getElementById("btnVerVendas");
const infoVendas = document.getElementById("infoVendas");

let historico = [];
let graficoParticipantes, graficoIngressos, graficoCategorias, graficoAvaliacao;
let swiper; // Swiper global
let currentUser = null;

// ======= Funções =======
function atualizarHistorico(id, status) {
  const now = new Date().toLocaleString();
  historico.unshift({ id, status, when: now });
  if (historico.length > 5) historico.pop();

  listaHistorico.innerHTML = "";
  historico.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.id} — ${item.status} (${item.when})`;
    li.className = item.status.toLowerCase();
    listaHistorico.appendChild(li);
  });
}

async function carregarEventos(uid) {
  eventoSelect.innerHTML = `<option value="">Selecione um evento</option>`;
  eventoSelectRelatorio.innerHTML = `<option value="">Selecione um evento</option>`;

  const q = query(collection(db, "Evento"), where("organizadorID", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum evento encontrado";
    eventoSelect.appendChild(option);
    eventoSelectRelatorio.appendChild(option.cloneNode(true));
    return;
  }

  snap.forEach(docEvento => {
    const evento = docEvento.data();
    const option = document.createElement("option");
    option.value = docEvento.id;
    option.textContent = evento.titulo || `(Sem título)`;
    eventoSelect.appendChild(option);
    eventoSelectRelatorio.appendChild(option.cloneNode(true));
  });
}

async function carregarParticipantes(eventoID) {
  listaParticipantes.innerHTML = "<li>Carregando participantes...</li>";
  const ingressosQuery = query(collection(db, "Ingresso"), where("eventoID", "==", eventoID));
  const ingressosSnap = await getDocs(ingressosQuery);

  listaParticipantes.innerHTML = "";
  if (ingressosSnap.empty) {
    listaParticipantes.innerHTML = "<li>Nenhum participante encontrado.</li>";
    return;
  }

  ingressosSnap.forEach(doc => {
    const ingresso = doc.data();
    const li = document.createElement("li");
    li.dataset.ticketId = doc.id;
    const usadoClass = ingresso.usado ? "usado" : "";

    li.innerHTML = `
      <span class="nome-participante">${ingresso.nomeParticipante || "Participante Anônimo"}</span>
      <div class="acoes">
        <label class="confirmar">
          <input type="checkbox" data-ingresso-id="${doc.id}" ${ingresso.confirmado ? "checked" : ""}>
          Confirmado
        </label>
        <span class="status-uso ${usadoClass}">${ingresso.usado ? "Usado" : "Não usado"}</span>
      </div>
    `;
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    listaParticipantes.appendChild(li);
  });
}

function iniciarScanner() {
  const scanner = new Instascan.Scanner({ video: document.getElementById('preview'), mirror: false });
  scanner.addListener('scan', async function(content) {
    try {
      const ingressoRef = doc(db, "Ingresso", content);
      const ingressoSnap = await getDoc(ingressoRef);
      if (!ingressoSnap.exists()) { 
        atualizarHistorico(content,"Inválido"); 
        statusEl.textContent = "Ingresso inválido!"; 
        statusEl.className="invalido"; 
        return; 
      }
      const ingressoData = ingressoSnap.data();
      if (ingressoData.usado) { 
        atualizarHistorico(content,"Usado"); 
        statusEl.textContent="Ingresso já utilizado!"; 
        statusEl.className="usado"; 
        return; 
      }
      await updateDoc(ingressoRef, { usado:true });
      atualizarHistorico(content,"Válido"); 
      statusEl.textContent="Ingresso válido! Entrada liberada."; 
      statusEl.className="valido";
    } catch(e){ 
      console.error(e); 
      atualizarHistorico(content,"Erro"); 
      statusEl.textContent="Erro na validação!"; 
      statusEl.className="invalido";
    }
  });

  Instascan.Camera.getCameras()
    .then(cameras => { if(cameras.length>0) scanner.start(cameras[0]); else alert("Nenhuma câmera encontrada.");})
    .catch(e=>alert("Erro ao acessar câmera."));
}

// ====== Relatórios ======
eventoSelectRelatorio.addEventListener("change", async () => {
  const eventoID = eventoSelectRelatorio.value;
  if(!eventoID){ relatoriosContainer.style.display="none"; return; }
  relatoriosContainer.style.display="block";
  await carregarRelatorios(eventoID);
});

async function carregarRelatorios(eventoID){
  const eventoRef = doc(db, "Evento", eventoID);
  const eventoSnap = await getDoc(eventoRef);
  if(!eventoSnap.exists()){ alert("Evento não encontrado."); return; }

  // Dados fictícios para gráficos (substitua por queries reais se necessário)
  const participantes = { confirmados: 120, pendentes: 30 };
  const ingressos = { vendidos: 100, disponiveis: 50 };
  const categorias = { estudante: 80, profissional: 40, outros: 30 };
  const avaliacao = { media: 4.5 };

  renderizarGraficoParticipantes(participantes);
  renderizarGraficoIngressos(ingressos);
  renderizarGraficoCategorias(categorias);
  renderizarGraficoAvaliacao(avaliacao);

  if(swiper) swiper.destroy(true, true);
  swiper = new Swiper('.swiper-container', {
    slidesPerView: 1,
    spaceBetween: 20,
    loop: false,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      640: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 }
    },
    grabCursor: true,
  });
}

function renderizarGraficoParticipantes(data){
  if(graficoParticipantes) graficoParticipantes.destroy();
  const ctx = document.getElementById("graficoParticipantes").getContext("2d");
  graficoParticipantes = new Chart(ctx,{ type:"doughnut", data:{ labels:["Confirmados","Pendentes"], datasets:[{ data:[data.confirmados,data.pendentes] }] } });
}

function renderizarGraficoIngressos(data){
  if(graficoIngressos) graficoIngressos.destroy();
  const ctx = document.getElementById("graficoIngressos").getContext("2d");
  graficoIngressos = new Chart(ctx,{ type:"bar", data:{ labels:["Vendidos","Disponíveis"], datasets:[{ data:[data.vendidos,data.disponiveis] }] } });
}

function renderizarGraficoCategorias(data){
  if(graficoCategorias) graficoCategorias.destroy();
  const ctx = document.getElementById("graficoCategorias").getContext("2d");
  graficoCategorias = new Chart(ctx,{ type:"pie", data:{ labels:["Estudante","Profissional","Outros"], datasets:[{ data:[data.estudante,data.profissional,data.outros] }] } });
}

function renderizarGraficoAvaliacao(data){
  if(graficoAvaliacao) graficoAvaliacao.destroy();
  const ctx = document.getElementById("graficoAvaliacao").getContext("2d");
  graficoAvaliacao = new Chart(ctx,{
    type:"bar",
    data:{ labels:["Avaliação Média"], datasets:[{ data:[data.media] }] },
    options:{ scales:{ y:{ beginAtZero:true, max:5 } } }
  });
}

// ======= Controle de abas =======
tabs.addEventListener("click", (e)=>{
  if(!e.target.classList.contains("tab")) return;
  tabs.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  e.target.classList.add("active");
  const tabName = e.target.dataset.tab;
  tabContents.forEach(tc=>{
    tc.style.display = (tc.id===tabName)?"block":"none";
    tc.classList.toggle("active", tc.id===tabName);
  });
});

// ======= Filtro de participantes =======
buscarParticipante.addEventListener("input", ()=>{
  const filtro = buscarParticipante.value.toLowerCase();
  listaParticipantes.querySelectorAll("li").forEach(li=>{
    li.style.display = li.textContent.toLowerCase().includes(filtro)?"flex":"none";
  });
});

// ======= Função para verificar organizador e habilitar ações =======
async function verificarOrganizadorECarregar(eventoID, uid) {
  try {
    const eventoRef = doc(db, "Evento", eventoID);
    const eventoSnap = await getDoc(eventoRef);
    if (!eventoSnap.exists()) {
      alert("Evento não encontrado.");
      return false;
    }
    const eventoData = eventoSnap.data();
    if (eventoData.organizadorID !== uid) {
      alert("Acesso negado: você não é o organizador deste evento.");
      return false;
    }

    // mostra ações
    eventoActions.style.display = "block";
    infoVendas.textContent = ""; // limpa
    // preenche botões
    btnEditarEvento.onclick = () => { window.location.href = `editarEvento.html?edit=${eventoID}`; };

    btnExcluirEvento.onclick = async () => {
      const confirma = confirm("Tem certeza que deseja excluir este evento? Esta ação é irreversível.");
      if (!confirma) return;
      try {
        await deleteDoc(eventoRef);
        alert("Evento excluído com sucesso.");
        window.location.href = "../home/meusEventos.html";
      } catch (e) {
        console.error(e);
        alert("Erro ao excluir evento.");
      }
    };

    btnVerVendas.onclick = async () => {
      // calcula total de ingressos (vendas) para este evento
      const ingressosQuery = query(collection(db, "Ingresso"), where("eventoID", "==", eventoID));
      const ingressosSnap = await getDocs(ingressosQuery);
      const total = ingressosSnap.size;
      infoVendas.textContent = `Ingressos registrados: ${total}`;
      // também podemos abrir aba Relatórios se quiser
      document.querySelector('.tab[data-tab="relatorios"]').click();
      eventoSelectRelatorio.value = eventoID;
      relatoriosContainer.style.display = "block";
      await carregarRelatorios(eventoID);
    };

    // carrega participantes e relatórios por padrão
    await carregarParticipantes(eventoID);
    // habilita abas
    tabs.style.display = "flex";
    document.querySelector('.tab[data-tab="participantes"]').click();
    return true;
  } catch (e) {
    console.error(e);
    alert("Erro ao verificar autorizacao do evento.");
    return false;
  }
}

// ======= Inicialização =======
onAuthStateChanged(auth, async (user)=>{
  if(!user){ window.location.href="../login.html"; return; }
  currentUser = user;
  await carregarEventos(user.uid);
  iniciarScanner();
  tabs.style.display="flex";

  // se tiver id na URL, tenta pré-selecionar e validar
  const params = new URLSearchParams(window.location.search);
  const preId = params.get("id");
  if(preId){
    // espera um pouco até que o select seja populado (carregarEventos já chamou)
    // mas como não podemos esperar indefinidamente, tentamos selecionar e, se não existir, recarregamos as opções
    setTimeout(async () => {
      // se opção existir, seleciona; se não, força carregarEventos novamente
      const opt = Array.from(eventoSelect.options).find(o=>o.value===preId);
      if(!opt){
        await carregarEventos(user.uid);
      }
      eventoSelect.value = preId;
      const ok = await verificarOrganizadorECarregar(preId, user.uid);
      if(!ok){
        // se não for organizador, desabilita ações (já alertou)
        eventoActions.style.display = "none";
      }
    }, 300);
  }
});

// quando o usuário muda o select, carrega os dados e valida organização
eventoSelect.addEventListener("change", async (e)=>{
  const eventoID = e.target.value;
  if(!eventoID){
    // ocultar tudo
    eventoActions.style.display = "none";
    tabContents.forEach(tc=>tc.style.display="none");
    tabs.style.display = "none";
    return;
  }
  const ok = await verificarOrganizadorECarregar(eventoID, currentUser.uid);
  if(!ok) {
    eventoActions.style.display = "none";
    return;
  }
});

// ======= Fim do arquivo =======
