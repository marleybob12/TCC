import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCegD0n3Me9KqiCBnOl6yb6w7wK-VGKk2M",
  authDomain: "eventflow-a9f99.firebaseapp.com",
  projectId: "eventflow-a9f99",
  storageBucket: "eventflow-a9f99.firebasestorage.app",
  messagingSenderId: "506021005268",
  appId: "1:506021005268:web:69f3c5a6dffb6e450bec59"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let eventoSelecionado = null;
let scanner = null;
let chartInstances = {};

// =====================
// Inicialização
// =====================
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializa UI e listeners (sem carregar eventos ainda)
  inicializarTabs();
  inicializarSwiper();
  
  // Event listeners (use ?. para evitar erros caso elemento não exista)
  document.getElementById('eventoSelect')?.addEventListener('change', handleEventoChange);
  document.getElementById('eventoSelectorRelatorio')?.addEventListener('change', handleRelatorioChange);
  document.getElementById('buscarParticipante')?.addEventListener('input', filtrarParticipantes);
  document.getElementById('btnEditarEvento')?.addEventListener('click', editarEvento);
  document.getElementById('btnVerVendas')?.addEventListener('click', verVendas);
  document.getElementById('btnExcluirEvento')?.addEventListener('click', excluirEvento);

  // Autenticação e nome do usuário
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '../login.html';
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, "Usuario", user.uid));
      if (userDoc.exists()) {
        document.querySelector(".user-name") && (document.querySelector(".user-name").textContent = userDoc.data().nome);
      }
    } catch (err) {
      console.error('Erro ao obter usuário:', err);
    }

    // Carrega eventos DO USUÁRIO APÓS autenticação confirmada
    await carregarEventos(user.uid);
  });

  // Logout principal usando signOut
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "../login.html";
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  });
});

// =====================
// Carregar Eventos do Organizador
// =====================
async function carregarEventos() {
  try {
    const user = auth.currentUser;
    if (!user) {
      window.location.href = '../login.html';
      return;
    }
      onAuthStateChanged(auth, async (user) => {
    if (!user) { // Se não estiver logado, redireciona para login
      window.location.href = "../login.html";
    } else {
      const userDoc = await getDoc(doc(db, "Usuario", user.uid)); // Busca documento do usuário no Firestore
      if (userDoc.exists()) {
        document.querySelector(".user-name").textContent = userDoc.data().nome; // Atualiza nome exibido no header
      }
    }
  });

  // (Opcional) Botão logout principal
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await logoutUsuario();
    window.location.href = "../login.html";
  });

    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, where('organizadorId', '==', user.uid));
    const snapshot = await getDocs(q);

    const selectEvento = document.getElementById('eventoSelect');
    const selectRelatorio = document.getElementById('eventoSelectorRelatorio');
    
    selectEvento.innerHTML = '<option value="">Selecione um evento</option>';
    selectRelatorio.innerHTML = '<option value="">Selecione um evento</option>';

    if (snapshot.empty) {
      selectEvento.innerHTML += '<option value="" disabled>Nenhum evento criado</option>';
      selectRelatorio.innerHTML += '<option value="" disabled>Nenhum evento criado</option>';
      return;
    }

    snapshot.forEach((doc) => {
      const evento = doc.data();
      const option1 = document.createElement('option');
      const option2 = document.createElement('option');
      
      option1.value = doc.id;
      option1.textContent = evento.titulo;
      option2.value = doc.id;
      option2.textContent = evento.titulo;
      
      selectEvento.appendChild(option1);
      selectRelatorio.appendChild(option2);
    });

  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    alert('Erro ao carregar eventos. Por favor, recarregue a página.');
  }
}

// =====================
// Mudança de Evento Selecionado
// =====================
async function handleEventoChange(e) {
  const eventoId = e.target.value;
  
  if (!eventoId) {
    document.getElementById('eventoActions').style.display = 'none';
    document.querySelector('.tabs').style.display = 'none';
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    return;
  }

  eventoSelecionado = eventoId;
  document.getElementById('eventoActions').style.display = 'flex';
  document.querySelector('.tabs').style.display = 'flex';
  
  // Mostrar primeira tab
  document.querySelector('.tab-content.active').style.display = 'block';
  
  await carregarDadosEvento(eventoId);
  await carregarParticipantes(eventoId);
  await calcularVendas(eventoId);
}

// =====================
// Carregar Dados do Evento
// =====================
async function carregarDadosEvento(eventoId) {
  try {
    const eventoDoc = await getDoc(doc(db, 'eventos', eventoId));
    if (!eventoDoc.exists()) return;
    
    const evento = eventoDoc.data();
    // Aqui você pode usar os dados do evento conforme necessário
    
  } catch (error) {
    console.error('Erro ao carregar dados do evento:', error);
  }
}

// =====================
// Calcular Vendas
// =====================
async function calcularVendas(eventoId) {
  try {
    const comprasRef = collection(db, 'compras');
    const q = query(comprasRef, where('eventoId', '==', eventoId));
    const snapshot = await getDocs(q);
    
    let totalVendas = 0;
    let totalIngressos = 0;
    
    snapshot.forEach((doc) => {
      const compra = doc.data();
      totalVendas += compra.valorTotal || 0;
      totalIngressos += 1;
    });
    
    const infoVendas = document.getElementById('infoVendas');
    infoVendas.textContent = `${totalIngressos} ingresso(s) vendido(s) | R$ ${totalVendas.toFixed(2)}`;
    
  } catch (error) {
    console.error('Erro ao calcular vendas:', error);
  }
}

// =====================
// Carregar Participantes
// =====================
async function carregarParticipantes(eventoId) {
  try {
    const comprasRef = collection(db, 'compras');
    const q = query(comprasRef, where('eventoId', '==', eventoId));
    const snapshot = await getDocs(q);
    
    const lista = document.getElementById('listaParticipantes');
    lista.innerHTML = '';
    
    if (snapshot.empty) {
      lista.innerHTML = '<div class="empty-state"><i>📭</i><p>Nenhum participante ainda</p></div>';
      return;
    }
    
    snapshot.forEach((doc) => {
      const compra = doc.data();
      const li = document.createElement('li');
      
      const statusClass = compra.usado ? 'usado' : 'valido';
      const statusTexto = compra.usado ? 'Usado' : 'Válido';
      
      li.innerHTML = `
        <div class="participante-info">
          <strong>${compra.nomeUsuario || 'Nome não disponível'}</strong>
          <span>${compra.emailUsuario || 'Email não disponível'}</span>
          <span>Lote: ${compra.nomeLote || 'N/A'} | R$ ${(compra.valorTotal || 0).toFixed(2)}</span>
        </div>
        <span class="status-uso ${statusClass}">${statusTexto}</span>
      `;
      
      lista.appendChild(li);
    });
    
  } catch (error) {
    console.error('Erro ao carregar participantes:', error);
    document.getElementById('listaParticipantes').innerHTML = 
      '<div class="empty-state"><i>❌</i><p>Erro ao carregar participantes</p></div>';
  }
}

// =====================
// Filtrar Participantes
// =====================
function filtrarParticipantes(e) {
  const busca = e.target.value.toLowerCase();
  const items = document.querySelectorAll('.participantes-lista li');
  
  items.forEach(item => {
    const texto = item.textContent.toLowerCase();
    item.style.display = texto.includes(busca) ? 'flex' : 'none';
  });
}

// =====================
// Tabs
// =====================
function inicializarTabs() {
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active de todas as tabs
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
      });
      
      // Ativa a tab clicada
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      const content = document.getElementById(tabName);
      content.style.display = 'block';
      content.classList.add('active');
      
      // Iniciar scanner se for a tab de validação
      if (tabName === 'validar') {
        iniciarScanner();
      } else if (scanner) {
        pararScanner();
      }
    });
  });
}

// =====================
// Scanner QR Code
// =====================
function iniciarScanner() {
  if (!eventoSelecionado) {
    alert('Selecione um evento primeiro!');
    return;
  }
  
  const video = document.getElementById('preview');
  
  scanner = new Instascan.Scanner({ 
    video: video,
    mirror: false
  });
  
  scanner.addListener('scan', async (content) => {
    await validarIngresso(content);
  });
  
  Instascan.Camera.getCameras().then(cameras => {
    if (cameras.length > 0) {
      scanner.start(cameras[0]);
      document.getElementById('status').textContent = 'Scanner ativo - Aponte o QR Code';
      document.getElementById('status').style.background = '#D1FAE5';
      document.getElementById('status').style.color = '#065F46';
    } else {
      document.getElementById('status').textContent = 'Nenhuma câmera encontrada';
      document.getElementById('status').style.background = '#FEE2E2';
      document.getElementById('status').style.color = '#991B1B';
    }
  }).catch(err => {
    console.error('Erro ao acessar câmera:', err);
    document.getElementById('status').textContent = 'Erro ao acessar câmera';
  });
}

function pararScanner() {
  if (scanner) {
    scanner.stop();
    scanner = null;
  }
}

// =====================
// Validar Ingresso
// =====================
async function validarIngresso(qrCode) {
  try {
    // QR Code no formato: compraId
    const comprasRef = collection(db, 'compras');
    const compraDoc = await getDoc(doc(db, 'compras', qrCode));
    
    if (!compraDoc.exists()) {
      mostrarStatus('Ingresso inválido!', 'erro');
      adicionarHistorico('Ingresso inválido', false);
      return;
    }
    
    const compra = compraDoc.data();
    
    // Verificar se é do evento selecionado
    if (compra.eventoId !== eventoSelecionado) {
      mostrarStatus('Ingresso de outro evento!', 'erro');
      adicionarHistorico('Ingresso de outro evento', false);
      return;
    }
    
    // Verificar se já foi usado
    if (compra.usado) {
      mostrarStatus('Ingresso já utilizado!', 'erro');
      adicionarHistorico(`${compra.nomeUsuario} - Já usado`, false);
      return;
    }
    
    // Marcar como usado
    await updateDoc(doc(db, 'compras', qrCode), {
      usado: true,
      dataUso: new Date().toISOString()
    });
    
    mostrarStatus('Ingresso validado com sucesso!', 'sucesso');
    adicionarHistorico(`${compra.nomeUsuario} - ${compra.nomeLote}`, true);
    
    // Recarregar participantes
    await carregarParticipantes(eventoSelecionado);
    
  } catch (error) {
    console.error('Erro ao validar ingresso:', error);
    mostrarStatus('Erro ao validar ingresso', 'erro');
  }
}

function mostrarStatus(mensagem, tipo) {
  const status = document.getElementById('status');
  status.textContent = mensagem;
  
  if (tipo === 'sucesso') {
    status.style.background = '#D1FAE5';
    status.style.color = '#065F46';
  } else {
    status.style.background = '#FEE2E2';
    status.style.color = '#991B1B';
  }
  
  setTimeout(() => {
    status.textContent = 'Aponte o QR Code do ingresso';
    status.style.background = 'var(--gray-100)';
    status.style.color = 'var(--gray-700)';
  }, 3000);
}

function adicionarHistorico(texto, sucesso) {
  const lista = document.getElementById('listaHistorico');
  const li = document.createElement('li');
  const agora = new Date().toLocaleTimeString('pt-BR');
  
  li.textContent = `${agora} - ${texto}`;
  li.style.background = sucesso ? '#D1FAE5' : '#FEE2E2';
  li.style.color = sucesso ? '#065F46' : '#991B1B';
  li.style.borderColor = sucesso ? '#10B981' : '#EF4444';
  
  lista.insertBefore(li, lista.firstChild);
  
  // Manter apenas os últimos 10
  if (lista.children.length > 10) {
    lista.removeChild(lista.lastChild);
  }
}

// =====================
// Relatórios
// =====================
async function handleRelatorioChange(e) {
  const eventoId = e.target.value;
  
  if (!eventoId) {
    document.getElementById('relatoriosContainer').style.display = 'none';
    return;
  }
  
  document.getElementById('relatoriosContainer').style.display = 'block';
  await gerarRelatorios(eventoId);
}

async function gerarRelatorios(eventoId) {
  try {
    const comprasRef = collection(db, 'compras');
    const q = query(comprasRef, where('eventoId', '==', eventoId));
    const snapshot = await getDocs(q);
    
    let totalParticipantes = 0;
    let ingressosUsados = 0;
    let ingressosValidos = 0;
    let categorias = {};
    
    snapshot.forEach((doc) => {
      const compra = doc.data();
      totalParticipantes++;
      
      if (compra.usado) {
        ingressosUsados++;
      } else {
        ingressosValidos++;
      }
      
      const cat = compra.nomeLote || 'Outros';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });
    
    // Gráfico de Participantes
    criarGrafico('graficoParticipantes', {
      type: 'doughnut',
      data: {
        labels: ['Confirmados'],
        datasets: [{
          data: [totalParticipantes],
          backgroundColor: ['#3B82F6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `${totalParticipantes} Participante(s)`,
            font: { size: 24, weight: 'bold' }
          }
        }
      }
    });
    
    // Gráfico de Status dos Ingressos
    criarGrafico('graficoIngressos', {
      type: 'pie',
      data: {
        labels: ['Usados', 'Válidos'],
        datasets: [{
          data: [ingressosUsados, ingressosValidos],
          backgroundColor: ['#EF4444', '#10B981']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
    
    // Gráfico de Categorias
    criarGrafico('graficoCategorias', {
      type: 'bar',
      data: {
        labels: Object.keys(categorias),
        datasets: [{
          label: 'Ingressos por Lote',
          data: Object.values(categorias),
          backgroundColor: '#3B82F6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    
    // Gráfico de Avaliação (placeholder)
    criarGrafico('graficoAvaliacao', {
      type: 'doughnut',
      data: {
        labels: ['Avaliação'],
        datasets: [{
          data: [4.5, 0.5],
          backgroundColor: ['#F59E0B', '#E5E7EB']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        circumference: 180,
        rotation: -90,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '4.5 / 5.0',
            font: { size: 24, weight: 'bold' }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
  }
}

function criarGrafico(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  // Destruir gráfico anterior se existir
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  
  chartInstances[canvasId] = new Chart(ctx, config);
}

// =====================
// Swiper
// =====================
function inicializarSwiper() {
  new Swiper('.swiper-container', {
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      }
    }
  });
}

// =====================
// Ações do Evento
// =====================
function editarEvento() {
  if (!eventoSelecionado) return;
  window.location.href = `editarEvento.html?id=${eventoSelecionado}`;
}

function verVendas() {
  if (!eventoSelecionado) return;
  // Mudar para aba de relatórios
  document.querySelector('[data-tab="relatorios"]').click();
  document.getElementById('eventoSelectorRelatorio').value = eventoSelecionado;
  handleRelatorioChange({ target: { value: eventoSelecionado } });
}

async function excluirEvento() {
  if (!eventoSelecionado) return;
  
  const confirma = confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.');
  if (!confirma) return;
  
  try {
    await deleteDoc(doc(db, 'eventos', eventoSelecionado));
    alert('Evento excluído com sucesso!');
    window.location.reload();
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    alert('Erro ao excluir evento. Tente novamente.');
  }
}

// =====================
// Menu Mobile
// =====================
window.toggleMenu = function() {
  document.getElementById('nav-links').classList.toggle('show');
}