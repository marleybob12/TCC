import { db } from "./firebaseConfig.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

const eventoSelector = document.getElementById("eventoSelector");
const relatoriosContainer = document.getElementById("relatoriosContainer");

// Referências aos gráficos
let graficoParticipantes, graficoIngressos, graficoCategorias, graficoAvaliacao;

// Carrega os eventos do organizador
async function carregarEventos() {
  const eventosQuery = query(collection(db, "Evento"));
  const eventosSnap = await getDocs(eventosQuery);

  eventosSnap.forEach((docEvento) => {
    const evento = docEvento.data();
    const option = document.createElement("option");
    option.value = docEvento.id;
    option.textContent = evento.titulo;
    eventoSelector.appendChild(option);
  });
}

// Atualiza os relatórios ao selecionar um evento
eventoSelector.addEventListener("change", async () => {
  const eventoID = eventoSelector.value;
  if (!eventoID) {
    relatoriosContainer.style.display = "none";
    return;
  }

  relatoriosContainer.style.display = "block";
  await carregarRelatorios(eventoID);
});

// Carrega os dados do evento e renderiza os gráficos
async function carregarRelatorios(eventoID) {
  const eventoRef = doc(db, "Evento", eventoID);
  const eventoSnap = await getDoc(eventoRef);

  if (!eventoSnap.exists()) {
    alert("Evento não encontrado.");
    return;
  }

  const evento = eventoSnap.data();

  // Dados fictícios para os gráficos (substitua pelos dados reais do Firestore)
  const participantes = { confirmados: 120, pendentes: 30 };
  const ingressos = { vendidos: 100, disponiveis: 50 };
  const categorias = { estudante: 80, profissional: 40, outros: 30 };
  const avaliacao = { media: 4.5 };

  renderizarGraficoParticipantes(participantes);
  renderizarGraficoIngressos(ingressos);
  renderizarGraficoCategorias(categorias);
  renderizarGraficoAvaliacao(avaliacao);
}

// Renderiza o gráfico de participantes
function renderizarGraficoParticipantes(data) {
  if (graficoParticipantes) graficoParticipantes.destroy();
  const ctx = document.getElementById("graficoParticipantes").getContext("2d");
  graficoParticipantes = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Confirmados", "Pendentes"],
      datasets: [{
        data: [data.confirmados, data.pendentes],
        backgroundColor: ["#2F78E3", "#E3E3E3"]
      }]
    }
  });
}

// Renderiza o gráfico de ingressos
function renderizarGraficoIngressos(data) {
  if (graficoIngressos) graficoIngressos.destroy();
  const ctx = document.getElementById("graficoIngressos").getContext("2d");
  graficoIngressos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Vendidos", "Disponíveis"],
      datasets: [{
        data: [data.vendidos, data.disponiveis],
        backgroundColor: ["#2F78E3", "#E3E3E3"]
      }]
    }
  });
}

// Renderiza o gráfico de categorias
function renderizarGraficoCategorias(data) {
  if (graficoCategorias) graficoCategorias.destroy();
  const ctx = document.getElementById("graficoCategorias").getContext("2d");
  graficoCategorias = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Estudante", "Profissional", "Outros"],
      datasets: [{
        data: [data.estudante, data.profissional, data.outros],
        backgroundColor: ["#2F78E3", "#199BD9", "#E3E3E3"]
      }]
    }
  });
}

// Renderiza o gráfico de avaliação média
function renderizarGraficoAvaliacao(data) {
  if (graficoAvaliacao) graficoAvaliacao.destroy();
  const ctx = document.getElementById("graficoAvaliacao").getContext("2d");
  graficoAvaliacao = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Avaliação Média"],
      datasets: [{
        data: [data.media],
        backgroundColor: ["#2F78E3"]
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 5 }
      }
    }
  });
}

// Inicializa a página
carregarEventos();
