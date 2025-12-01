// painelOrganizador.js - VERSÃO CORRIGIDA
import { auth, db } from "../javaScript/firebaseConfig.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let eventoSelecionado = null;
let scanner = null;
let chartInstances = {};
let currentUser = null;

// =====================
// Inicialização
// =====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 Inicializando Painel do Organizador...');
  
  inicializarTabs();
  inicializarSwiper();
  
  // Event listeners
  document.getElementById('eventoSelect')?.addEventListener('change', handleEventoChange);
  document.getElementById('eventoSelectorRelatorio')?.addEventListener('change', handleRelatorioChange);
  document.getElementById('buscarParticipante')?.addEventListener('input', filtrarParticipantes);
  document.getElementById('btnEditarEvento')?.addEventListener('click', editarEvento);
  document.getElementById('btnVerVendas')?.addEventListener('click', verVendas);
  document.getElementById('btnExcluirEvento')?.addEventListener('click', excluirEvento);

  // Autenticação
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log('❌ Usuário não autenticado');
      window.location.href = '../login.html';
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.uid);
    currentUser = user;
    
    try {
      // Atualiza nome do usuário
      const userDoc = await getDoc(doc(db, "Usuario", user.uid));
      if (userDoc.exists()) {
        const userName = document.querySelector(".user-name");
        if (userName) {
          userName.textContent = userDoc.data().nome || "Organizador";
        }
      }
      
      // Carrega eventos do usuário
      await carregarEventos(user.uid);
      
    } catch (err) {
      console.error('❌ Erro ao carregar dados do usuário:', err);
    }
  });
});

// =====================
// Carregar Eventos do Organizador
// =====================
async function carregarEventos(userId) {
  try {
    console.log('🔍 Buscando eventos do organizador:', userId);
    
    const selectEvento = document.getElementById('eventoSelect');
    const selectRelatorio = document.getElementById('eventoSelectorRelatorio');
    
    if (!selectEvento || !selectRelatorio) {
      console.error('❌ Elementos select não encontrados');
      return;
    }
    
    selectEvento.innerHTML = '<option value="">Carregando eventos...</option>';
    selectRelatorio.innerHTML = '<option value="">Carregando eventos...</option>';

    // Query CORRIGIDA: usar organizadorID (como está no banco)
    const eventosRef = collection(db, 'Evento');
    const q = query(eventosRef, where('organizadorID', '==', userId));
    const snapshot = await getDocs(q);

    console.log(`📊 Encontrados ${snapshot.size} evento(s)`);

    if (snapshot.empty) {
      selectEvento.innerHTML = '<option value="">Nenhum evento criado</option>';
      selectRelatorio.innerHTML = '<option value="">Nenhum evento criado</option>';
      
      // Mostra mensagem amigável
      const lista = document.getElementById('listaParticipantes');
      if (lista) {
        lista.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-plus"></i>
            <p>Você ainda não criou nenhum evento</p>
            <a href="../home/criarEvento.html" class="btn" style="margin-top:20px;">
              <i class="fas fa-plus"></i> Criar Primeiro Evento
            </a>
          </div>
        `;
      }
      return;
    }

    selectEvento.innerHTML = '<option value="">Selecione um evento</option>';
    selectRelatorio.innerHTML = '<option value="">Selecione um evento</option>';

    snapshot.forEach((docSnap) => {
      const evento = docSnap.data();
      const option1 = document.createElement('option');
      const option2 = document.createElement('option');
      
      option1.value = docSnap.id;
      option1.textContent = evento.titulo || 'Evento sem título';
      option2.value = docSnap.id;
      option2.textContent = evento.titulo || 'Evento sem título';
      
      selectEvento.appendChild(option1);
      selectRelatorio.appendChild(option2);
    });

    console.log('✅ Eventos carregados com sucesso');

  } catch (error) {
    console.error('❌ Erro ao carregar eventos:', error);
    
    const selectEvento = document.getElementById('eventoSelect');
    if (selectEvento) {
      selectEvento.innerHTML = '<option value="">Erro ao carregar eventos</option>';
    }
    
    alert('Erro ao carregar seus eventos. Tente recarregar a página.');
  }
}

// =====================
// Mudança de Evento Selecionado
// =====================
async function handleEventoChange(e) {
  const eventoId = e.target.value;
  
  console.log('🎯 Evento selecionado:', eventoId);
  
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
  const primeiraTab = document.getElementById('participantes');
  if (primeiraTab) {
    primeiraTab.style.display = 'block';
  }
  
  await carregarDadosEvento(eventoId);
  await carregarParticipantes(eventoId);
  await calcularVendas(eventoId);
}

// =====================
// Carregar Dados do Evento
// =====================
async function carregarDadosEvento(eventoId) {
  try {
    console.log('📄 Carregando dados do evento:', eventoId);
    
    const eventoDoc = await getDoc(doc(db, 'Evento', eventoId));
    if (!eventoDoc.exists()) {
      console.error('❌ Evento não encontrado');
      return;
    }
    
    const evento = eventoDoc.data();
    console.log('✅ Dados do evento carregados:', evento.titulo);
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados do evento:', error);
  }
}

// =====================
// Calcular Vendas
// =====================
async function calcularVendas(eventoId) {
  try {
    console.log('💰 Calculando vendas para:', eventoId);
    
    // Query CORRIGIDA: buscar ingressos vendidos
    const ingressosRef = collection(db, 'Ingresso');
    const q = query(ingressosRef, where('eventoID', '==', eventoId));
    const snapshot = await getDocs(q);
    
    let totalVendas = 0;
    let totalIngressos = snapshot.size;
    
    // Calcular total de vendas
    for (const docSnap of snapshot.docs) {
      const ingresso = docSnap.data();
      
      // Buscar preço do lote
      if (ingresso.loteID) {
        const loteDoc = await getDoc(doc(db, 'Lote', ingresso.loteID));
        if (loteDoc.exists()) {
          const lote = loteDoc.data();
          totalVendas += lote.preco || 0;
        }
      }
    }
    
    const infoVendas = document.getElementById('infoVendas');
    if (infoVendas) {
      infoVendas.innerHTML = `
        <i class="fas fa-ticket-alt"></i> ${totalIngressos} ingresso(s) vendido(s) | 
        <i class="fas fa-dollar-sign"></i> R$ ${totalVendas.toFixed(2)}
      `;
    }
    
    console.log(`✅ Vendas: ${totalIngressos} ingressos | R$ ${totalVendas.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Erro ao calcular vendas:', error);
  }
}

// =====================
// Carregar Participantes
// =====================
async function carregarParticipantes(eventoId) {
  try {
    console.log('👥 Carregando participantes para:', eventoId);
    
    const lista = document.getElementById('listaParticipantes');
    if (!lista) return;
    
    lista.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    
    // Query CORRIGIDA: buscar ingressos do evento
    const ingressosRef = collection(db, 'Ingresso');
    const q = query(ingressosRef, where('eventoID', '==', eventoId));
    const snapshot = await getDocs(q);
    
    console.log(`📊 Encontrados ${snapshot.size} participante(s)`);
    
    if (snapshot.empty) {
      lista.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Nenhum ingresso vendido ainda</p>
        </div>
      `;
      return;
    }
    
    lista.innerHTML = '';
    
    for (const docSnap of snapshot.docs) {
      const ingresso = docSnap.data();
      
      // Buscar dados do usuário
      let nomeUsuario = 'Usuário';
      let emailUsuario = 'Email não disponível';
      
      if (ingresso.usuarioID) {
        const userDoc = await getDoc(doc(db, 'Usuario', ingresso.usuarioID));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          nomeUsuario = userData.nome || 'Usuário';
          emailUsuario = userData.email || 'Email não disponível';
        }
      }
      
      // Buscar dados do lote
      let nomeLote = 'Lote não disponível';
      let precoLote = 0;
      
      if (ingresso.loteID) {
        const loteDoc = await getDoc(doc(db, 'Lote', ingresso.loteID));
        if (loteDoc.exists()) {
          const loteData = loteDoc.data();
          nomeLote = loteData.nome || 'Lote';
          precoLote = loteData.preco || 0;
        }
      }
      
      const li = document.createElement('li');
      
      const statusClass = ingresso.usado ? 'usado' : 'valido';
      const statusTexto = ingresso.usado ? '❌ Usado' : '✅ Válido';
      
      li.innerHTML = `
        <div class="participante-info">
          <strong>${nomeUsuario}</strong>
          <span>${emailUsuario}</span>
          <span>Lote: ${nomeLote} | R$ ${precoLote.toFixed(2)}</span>
          ${ingresso.dataCompra ? `<span style="font-size:0.85rem;color:#6B7280;">Comprado em: ${new Date(ingresso.dataCompra.seconds * 1000).toLocaleDateString('pt-BR')}</span>` : ''}
        </div>
        <span class="status-uso ${statusClass}">${statusTexto}</span>
      `;
      
      lista.appendChild(li);
    }
    
    console.log('✅ Participantes carregados');
    
  } catch (error) {
    console.error('❌ Erro ao carregar participantes:', error);
    const lista = document.getElementById('listaParticipantes');
    if (lista) {
      lista.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erro ao carregar participantes</p>
        </div>
      `;
    }
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
      
      if (content) {
        content.style.display = 'block';
        content.classList.add('active');
      }
      
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
  const statusEl = document.getElementById('status');
  
  if (!video || !statusEl) {
    console.error('❌ Elementos de scanner não encontrados');
    return;
  }
  
  try {
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
        statusEl.textContent = '📷 Scanner ativo - Aponte o QR Code';
        statusEl.style.background = '#D1FAE5';
        statusEl.style.color = '#065F46';
      } else {
        statusEl.textContent = '❌ Nenhuma câmera encontrada';
        statusEl.style.background = '#FEE2E2';
        statusEl.style.color = '#991B1B';
      }
    }).catch(err => {
      console.error('❌ Erro ao acessar câmera:', err);
      statusEl.textContent = '❌ Erro ao acessar câmera';
      statusEl.style.background = '#FEE2E2';
      statusEl.style.color = '#991B1B';
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar scanner:', error);
    statusEl.textContent = '❌ Erro ao inicializar scanner';
  }
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
    console.log('🎫 Validando ingresso:', qrCode);
    
    // Extrair ID do QR Code (formato: EVENTFLOW-{id})
    const ingressoId = qrCode.replace('EVENTFLOW-', '');
    
    // Buscar ingresso
    const ingressoDoc = await getDoc(doc(db, 'Ingresso', ingressoId));
    
    if (!ingressoDoc.exists()) {
      mostrarStatus('❌ Ingresso inválido!', 'erro');
      adicionarHistorico('Ingresso inválido', false);
      return;
    }
    
    const ingresso = ingressoDoc.data();
    
    // Verificar se é do evento selecionado
    if (ingresso.eventoID !== eventoSelecionado) {
      mostrarStatus('❌ Ingresso de outro evento!', 'erro');
      adicionarHistorico('Ingresso de outro evento', false);
      return;
    }
    
    // Verificar se já foi usado
    if (ingresso.usado) {
      mostrarStatus('❌ Ingresso já utilizado!', 'erro');
      
      // Buscar nome do usuário
      let nomeUsuario = 'Usuário';
      if (ingresso.usuarioID) {
        const userDoc = await getDoc(doc(db, 'Usuario', ingresso.usuarioID));
        if (userDoc.exists()) {
          nomeUsuario = userDoc.data().nome || 'Usuário';
        }
      }
      
      adicionarHistorico(`${nomeUsuario} - Já usado`, false);
      return;
    }
    
    // Marcar como usado
    await updateDoc(doc(db, 'Ingresso', ingressoId), {
      usado: true,
      dataUso: new Date()
    });
    
    // Buscar informações para histórico
    let nomeUsuario = 'Usuário';
    let nomeLote = 'Lote';
    
    if (ingresso.usuarioID) {
      const userDoc = await getDoc(doc(db, 'Usuario', ingresso.usuarioID));
      if (userDoc.exists()) {
        nomeUsuario = userDoc.data().nome || 'Usuário';
      }
    }
    
    if (ingresso.loteID) {
      const loteDoc = await getDoc(doc(db, 'Lote', ingresso.loteID));
      if (loteDoc.exists()) {
        nomeLote = loteDoc.data().nome || 'Lote';
      }
    }
    
    mostrarStatus('✅ Ingresso validado com sucesso!', 'sucesso');
    adicionarHistorico(`${nomeUsuario} - ${nomeLote}`, true);
    
    // Recarregar participantes
    await carregarParticipantes(eventoSelecionado);
    
  } catch (error) {
    console.error('❌ Erro ao validar ingresso:', error);
    mostrarStatus('❌ Erro ao validar ingresso', 'erro');
  }
}

function mostrarStatus(mensagem, tipo) {
  const status = document.getElementById('status');
  if (!status) return;
  
  status.textContent = mensagem;
  
  if (tipo === 'sucesso') {
    status.style.background = '#D1FAE5';
    status.style.color = '#065F46';
  } else {
    status.style.background = '#FEE2E2';
    status.style.color = '#991B1B';
  }
  
  setTimeout(() => {
    status.textContent = '📷 Aponte o QR Code do ingresso';
    status.style.background = 'var(--gray-100)';
    status.style.color = 'var(--gray-700)';
  }, 3000);
}

function adicionarHistorico(texto, sucesso) {
  const lista = document.getElementById('listaHistorico');
  if (!lista) return;
  
  // Remove mensagem inicial
  if (lista.querySelector('li')?.textContent.includes('Nenhuma validação')) {
    lista.innerHTML = '';
  }
  
  const li = document.createElement('li');
  const agora = new Date().toLocaleTimeString('pt-BR');
  
  li.textContent = `${agora} - ${texto}`;
  li.style.background = sucesso ? '#D1FAE5' : '#FEE2E2';
  li.style.color = sucesso ? '#065F46' : '#991B1B';
  li.style.padding = '12px';
  li.style.borderRadius = '8px';
  li.style.marginBottom = '8px';
  li.style.borderLeft = sucesso ? '3px solid #10B981' : '3px solid #EF4444';
  
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
  
  console.log('📊 Gerando relatórios para:', eventoId);
  
  const container = document.getElementById('relatoriosContainer');
  
  if (!eventoId || !container) {
    if (container) container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  await gerarRelatorios(eventoId);
}

async function gerarRelatorios(eventoId) {
  try {
    console.log('📈 Gerando gráficos...');
    
    const ingressosRef = collection(db, 'Ingresso');
    const q = query(ingressosRef, where('eventoID', '==', eventoId));
    const snapshot = await getDocs(q);
    
    let totalParticipantes = snapshot.size;
    let ingressosUsados = 0;
    let ingressosValidos = 0;
    let categorias = {};
    
    for (const docSnap of snapshot.docs) {
      const ingresso = docSnap.data();
      
      if (ingresso.usado) {
        ingressosUsados++;
      } else {
        ingressosValidos++;
      }
      
      // Buscar nome do lote
      if (ingresso.loteID) {
        const loteDoc = await getDoc(doc(db, 'Lote', ingresso.loteID));
        if (loteDoc.exists()) {
          const loteNome = loteDoc.data().nome || 'Outros';
          categorias[loteNome] = (categorias[loteNome] || 0) + 1;
        }
      }
    }
    
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
    
    console.log('✅ Gráficos gerados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatórios:', error);
  }
}

function criarGrafico(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`❌ Canvas ${canvasId} não encontrado`);
    return;
  }
  
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
  alert('Funcionalidade de edição em desenvolvimento');
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
  
  const confirma = confirm('⚠️ Tem certeza que deseja excluir este evento?\n\nEsta ação NÃO pode ser desfeita e todos os ingressos vendidos serão invalidados.');
  if (!confirma) return;
  
  try {
    await deleteDoc(doc(db, 'Evento', eventoSelecionado));
    alert('✅ Evento excluído com sucesso!');
    window.location.reload();
  } catch (error) {
    console.error('❌ Erro ao excluir evento:', error);
    alert('❌ Erro ao excluir evento. Tente novamente.');
  }
}

// =====================
// Menu Mobile
// =====================
window.toggleMenu = function() {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
    navLinks.classList.toggle('show');
  }
}