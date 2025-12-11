// public/javaScript/evento.js
import { auth, db } from "./firebaseConfig.js";
import { EventFlowAPI } from "./api.js";  // ← IMPORTA O CLIENTE
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Elementos do DOM
const tituloEl = document.getElementById("tituloEvento");
const bannerEl = document.getElementById("bannerEvento");
const descricaoEl = document.getElementById("descricaoEvento");
const dataEl = document.getElementById("dataEvento");
const localEl = document.getElementById("localEvento");
const listaIngressos = document.getElementById("listaIngressos");

let eventoAtual = null;
let lotesDisponiveis = [];
let usuarioLogado = null;

/**
 * Formata timestamp do Firestore para data legível
 */
function formatarData(timestamp) {
  if (!timestamp) return "A definir";
  
  try {
    // Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString("pt-BR", {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    }
    
    // Timestamp com seconds
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString("pt-BR", {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    }
    
    // String de data
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date)) {
        return date.toLocaleString("pt-BR", {
          dateStyle: 'short',
          timeStyle: 'short'
        });
      }
    }
    
    // Objeto Date
    if (timestamp instanceof Date && !isNaN(timestamp)) {
      return timestamp.toLocaleString("pt-BR", {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    }
  } catch (error) {
    console.error("Erro ao formatar data:", error);
  }
  
  return "A definir";
}

/**
 * Verifica se o lote está disponível para venda
 */
function verificarDisponibilidade(lote) {
  const agora = new Date();
  
  // Verifica quantidade
  if (!lote.quantidade || lote.quantidade <= 0) {
    return { disponivel: false, motivo: "Esgotado" };
  }
  
  // Verifica data de início (se existir)
  if (lote.dataInicio) {
    try {
      const dataInicio = lote.dataInicio.toDate ? lote.dataInicio.toDate() : new Date(lote.dataInicio);
      if (agora < dataInicio) {
        return { 
          disponivel: false, 
          motivo: `Vendas iniciam em ${dataInicio.toLocaleDateString("pt-BR")}` 
        };
      }
    } catch (e) {
      console.warn("Erro ao verificar data de início:", e);
    }
  }
  
  // Verifica data de fim (se existir)
  if (lote.dataFim) {
    try {
      const dataFim = lote.dataFim.toDate ? lote.dataFim.toDate() : new Date(lote.dataFim);
      if (agora > dataFim) {
        return { disponivel: false, motivo: "Prazo expirado" };
      }
    } catch (e) {
      console.warn("Erro ao verificar data de fim:", e);
    }
  }
  
  return { disponivel: true };
}

/**
 * Carrega dados do evento
 */
async function carregarEvento(eventoId) {
  try {
    console.log("🔍 Carregando evento:", eventoId);
    
    // Mostrar loading
    tituloEl.textContent = "Carregando evento...";
    descricaoEl.textContent = "Por favor aguarde...";
    
    // Buscar evento
    const eventoDoc = await getDoc(doc(db, "Evento", eventoId));
    
    if (!eventoDoc.exists()) {
      throw new Error("Evento não encontrado");
    }
    
    eventoAtual = { id: eventoDoc.id, ...eventoDoc.data() };
    console.log("📋 Dados do evento:", eventoAtual);
    
    // Atualizar interface
    tituloEl.textContent = eventoAtual.titulo || "Evento sem título";
    descricaoEl.textContent = eventoAtual.descricao || "Sem descrição disponível";
    dataEl.textContent = formatarData(eventoAtual.dataInicio);
    
    // Buscar local se tiver localID
    if (eventoAtual.localID) {
      try {
        const localDoc = await getDoc(doc(db, "Local", eventoAtual.localID));
        if (localDoc.exists()) {
          const localData = localDoc.data();
          localEl.textContent = localData.endereco || "Local a definir";
        } else {
          localEl.textContent = eventoAtual.local || "Local a definir";
        }
      } catch (error) {
        console.warn("Erro ao buscar local:", error);
        localEl.textContent = eventoAtual.local || "Local a definir";
      }
    } else {
      localEl.textContent = eventoAtual.local || "Local a definir";
    }
    
    // Banner
    if (eventoAtual.imagemBanner) {
      bannerEl.src = eventoAtual.imagemBanner;
      bannerEl.style.display = "block";
      bannerEl.onerror = () => {
        console.warn("Erro ao carregar banner");
        bannerEl.style.display = "none";
      };
    } else {
      bannerEl.style.display = "none";
    }
    
    // Carregar lotes
    await carregarLotes(eventoId);
    
    console.log("✅ Evento carregado:", eventoAtual.titulo);
    
  } catch (error) {
    console.error("❌ Erro ao carregar evento:", error);
    
    tituloEl.textContent = "Erro ao carregar evento";
    descricaoEl.textContent = error.message;
    dataEl.textContent = "-";
    localEl.textContent = "-";
    
    listaIngressos.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p><strong>Não foi possível carregar o evento</strong></p>
        <p style="font-size:14px;margin-top:10px;">${error.message}</p>
        <a href="home.html" class="btn" style="margin-top:20px;">Voltar para Home</a>
      </div>
    `;
  }
}

/**
 * Carrega lotes (ingressos) do evento
 */
async function carregarLotes(eventoId) {
  try {
    console.log("🎫 Carregando lotes do evento:", eventoId);
    
    listaIngressos.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Carregando ingressos...</p></div>';
    
    // Buscar lotes vinculados ao evento
    const lotesQuery = query(
      collection(db, "Lote"),
      where("eventoID", "==", eventoId)
    );
    
    const lotesSnap = await getDocs(lotesQuery);
    
    console.log(`📦 Lotes encontrados: ${lotesSnap.size}`);
    
    if (lotesSnap.empty) {
      listaIngressos.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <p>Nenhum ingresso disponível para este evento</p>
          <p style="font-size:14px;color:var(--gray-500);margin-top:10px;">
            Entre em contato com o organizador para mais informações
          </p>
        </div>
      `;
      return;
    }
    
    lotesDisponiveis = [];
    listaIngressos.innerHTML = "";
    
    lotesSnap.forEach((docLote) => {
      const lote = { id: docLote.id, ...docLote.data() };
      console.log("🎟️ Lote:", lote);
      lotesDisponiveis.push(lote);
      
      const card = criarCardLote(lote);
      listaIngressos.appendChild(card);
    });
    
    console.log(`✅ ${lotesDisponiveis.length} lote(s) carregado(s)`);
    
  } catch (error) {
    console.error("❌ Erro ao carregar lotes:", error);
    listaIngressos.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p><strong>Erro ao carregar ingressos</strong></p>
        <p style="font-size:14px;margin-top:10px;">${error.message}</p>
      </div>
    `;
  }
}

/**
 * Cria card visual do lote
 */
function criarCardLote(lote) {
  const card = document.createElement("div");
  card.className = "lote-card";
  
  const { disponivel, motivo } = verificarDisponibilidade(lote);
  
  const badge = disponivel 
    ? '<span class="badge-disponivel"><i class="fas fa-check-circle"></i> Disponível</span>'
    : '<span class="badge-esgotado"><i class="fas fa-times-circle"></i> Indisponível</span>';
  
  const preco = typeof lote.preco === 'number' ? lote.preco.toFixed(2) : "0.00";
  const quantidade = typeof lote.quantidade === 'number' ? lote.quantidade : 0;
  
  card.innerHTML = `
    ${badge}
    
    <h3>${lote.nome || "Ingresso"}</h3>
    
    <div class="lote-preco">
      <span class="label">Valor:</span>
      <span class="valor">${preco}</span>
    </div>
    
    <div class="lote-disponibilidade">
      <i class="fas fa-ticket-alt"></i>
      <div class="texto">
        <span class="qtdIngressos">${quantidade}</span> 
        ${quantidade === 1 ? 'ingresso disponível' : 'ingressos disponíveis'}
      </div>
    </div>
    
    ${!disponivel ? `
      <div style="background:#FEE2E2;color:#991B1B;padding:12px;border-radius:8px;margin:12px 0;font-size:14px;">
        <i class="fas fa-info-circle"></i> ${motivo}
      </div>
    ` : ''}
    
    <button 
      class="btnComprar" 
      data-lote-id="${lote.id}"
      ${!disponivel ? 'disabled' : ''}
    >
      <i class="fas fa-shopping-cart"></i>
      ${disponivel ? 'Comprar Ingresso' : 'Indisponível'}
    </button>
  `;
  
  // Adicionar evento de clique
  const btnComprar = card.querySelector(".btnComprar");
  if (btnComprar) {
    btnComprar.addEventListener("click", () => comprarIngresso(lote.id));
  }
  
  return card;
}

/**
 * Processa compra do ingresso via API
 */
async function comprarIngresso(loteId) {
  if (!usuarioLogado) {
    if (confirm("⚠️ Você precisa estar logado para comprar ingressos.\n\nDeseja fazer login agora?")) {
      window.location.href = "../login.html?redirect=" + encodeURIComponent(window.location.href);
    }
    return;
  }
  
  if (!eventoAtual) {
    alert("❌ Erro: Evento não carregado. Por favor, recarregue a página.");
    return;
  }
  
  const btn = document.querySelector(`[data-lote-id="${loteId}"]`);
  if (!btn) {
    alert("❌ Erro: Botão não encontrado");
    return;
  }
  
  const textoOriginal = btn.innerHTML;
  
  try {
    // Desabilita botão
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando compra...';
    
    console.log("🛒 Iniciando compra:", {
      usuarioID: usuarioLogado.uid,
      eventoID: eventoAtual.id,
      loteID: loteId
    });
    
    // Chamar API para criar ingresso e enviar email
    const response = await fetch("/api/comprar-ingresso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioID: usuarioLogado.uid,
        eventoID: eventoAtual.id,
        loteID: loteId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Erro ao processar compra");
    }
    
    console.log("✅ Compra realizada:", result.data);
    
    // Atualiza botão para sucesso
    btn.classList.add("sucesso");
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Compra Confirmada!';
    
    // Mostrar modal de sucesso
    mostrarModalSucesso(result.data);
    
    // Recarregar lotes após 2 segundos
    setTimeout(() => {
      carregarLotes(eventoAtual.id);
    }, 2000);
    
  } catch (error) {
    console.error("❌ Erro na compra:", error);
    
    // Restaurar botão
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    
    // Mostrar erro amigável
    alert(
      `❌ Não foi possível processar sua compra\n\n` +
      `Motivo: ${error.message}\n\n` +
      `Por favor, tente novamente. Se o problema persistir, entre em contato com o suporte.`
    );
  }
}

/**
 * Mostra modal de sucesso após compra
 */
function mostrarModalSucesso(dados) {
  const modal = document.createElement("div");
  modal.className = "mensagem-sucesso";
  
  modal.innerHTML = `
    <div class="mensagem-conteudo">
      <h3>
        <i class="fas fa-check-circle"></i>
        Compra Realizada com Sucesso!
      </h3>
      
      <p><strong>Evento:</strong> ${dados.eventoTitulo || eventoAtual.titulo}</p>
      <p><strong>Lote:</strong> ${dados.loteNome}</p>
      <p><strong>ID do Ingresso:</strong> ${dados.ingressoID}</p>
      
      <div class="info-email">
        <i class="fas fa-envelope"></i>
        <strong>Seu ingresso foi enviado para:</strong><br>
        ${dados.usuarioEmail}
      </div>
      
      <p class="info-secundaria">
        <i class="fas fa-info-circle"></i>
        O PDF com o QR Code chegará em alguns minutos.
        Verifique também a caixa de spam.
      </p>
      
      <button onclick="this.closest('.mensagem-sucesso').remove()">
        Fechar
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fechar ao clicar fora
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Inicialização
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando página de evento...");
  
  // Pegar ID do evento da URL
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get("id");
  
  console.log("📌 ID do evento da URL:", eventoId);
  
  if (!eventoId) {
    tituloEl.textContent = "Erro";
    descricaoEl.textContent = "ID do evento não fornecido na URL";
    dataEl.textContent = "-";
    localEl.textContent = "-";
    
    listaIngressos.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p><strong>Evento não especificado</strong></p>
        <p style="font-size:14px;margin-top:10px;">
          A URL deve conter o parâmetro ?id=EVENTO_ID
        </p>
        <a href="home.html" class="btn" style="margin-top:20px;">Voltar para Home</a>
      </div>
    `;
    return;
  }
  
  // Verificar autenticação
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("✅ Usuário autenticado:", user.uid);
      usuarioLogado = user;
      
      // Atualizar nome no header se existir
      try {
        const userDoc = await getDoc(doc(db, "Usuario", user.uid));
        if (userDoc.exists()) {
          const userName = document.querySelector(".user-name");
          if (userName) {
            userName.textContent = userDoc.data().nome || "Usuário";
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    } else {
      console.log("⚠️ Usuário não autenticado (pode ver mas não comprar)");
    }
    
    // Carregar evento (independente de autenticação)
    carregarEvento(eventoId);
  });
});
async function comprarIngresso(loteId) {
  if (!usuarioLogado) {
    if (confirm("⚠️ Você precisa estar logado para comprar ingressos.\n\nDeseja fazer login agora?")) {
      window.location.href = "../login.html?redirect=" + encodeURIComponent(window.location.href);
    }
    return;
  }
  
  if (!eventoAtual) {
    alert("❌ Erro: Evento não carregado. Por favor, recarregue a página.");
    return;
  }
  
  const btn = document.querySelector(`[data-lote-id="${loteId}"]`);
  if (!btn) return;
  
  const textoOriginal = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando compra...';
    
    console.log("🛒 Iniciando compra via API externa");
    
    // ✅ AGORA USA O BACKEND SEPARADO
    const result = await EventFlowAPI.comprarIngresso(
      usuarioLogado.uid,
      eventoAtual.id,
      loteId
    );
    
    console.log("✅ Compra realizada:", result.data);
    
    btn.classList.add("sucesso");
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Compra Confirmada!';
    
    mostrarModalSucesso(result.data);
    
    setTimeout(() => carregarLotes(eventoAtual.id), 2000);
    
  } catch (error) {
    console.error("❌ Erro na compra:", error);
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    alert(`❌ Não foi possível processar sua compra\n\nMotivo: ${error.message}`);
  }
}