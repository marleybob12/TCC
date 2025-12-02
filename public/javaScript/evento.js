// public/javaScript/evento.js - INTEGRADO COM APIs
import { auth, db } from "./firebaseConfig.js";
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
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString("pt-BR");
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString("pt-BR");
    }
    const date = new Date(timestamp);
    if (!isNaN(date)) {
      return date.toLocaleString("pt-BR");
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
  
  // Verifica data de início
  if (lote.dataInicio) {
    const dataInicio = lote.dataInicio.toDate ? lote.dataInicio.toDate() : new Date(lote.dataInicio);
    if (agora < dataInicio) {
      return { 
        disponivel: false, 
        motivo: `Vendas iniciam em ${dataInicio.toLocaleDateString("pt-BR")}` 
      };
    }
  }
  
  // Verifica data de fim
  if (lote.dataFim) {
    const dataFim = lote.dataFim.toDate ? lote.dataFim.toDate() : new Date(lote.dataFim);
    if (agora > dataFim) {
      return { disponivel: false, motivo: "Prazo expirado" };
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
    
    // Buscar evento
    const eventoDoc = await getDoc(doc(db, "Evento", eventoId));
    
    if (!eventoDoc.exists()) {
      throw new Error("Evento não encontrado");
    }
    
    eventoAtual = { id: eventoDoc.id, ...eventoDoc.data() };
    
    // Atualizar interface
    tituloEl.textContent = eventoAtual.titulo || "Evento";
    descricaoEl.textContent = eventoAtual.descricao || "Sem descrição";
    dataEl.textContent = formatarData(eventoAtual.dataInicio);
    localEl.textContent = eventoAtual.local || "Local a definir";
    
    // Banner
    if (eventoAtual.imagemBanner) {
      bannerEl.src = eventoAtual.imagemBanner;
      bannerEl.style.display = "block";
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
    listaIngressos.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Não foi possível carregar o evento.</p>
        <a href="home.html" class="btn">Voltar para Home</a>
      </div>
    `;
  }
}

/**
 * Carrega lotes (ingressos) do evento
 */
async function carregarLotes(eventoId) {
  try {
    console.log("🎫 Carregando lotes do evento...");
    
    listaIngressos.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando ingressos...</div>';
    
    // Buscar lotes
    const lotesQuery = query(
      collection(db, "Lote"),
      where("eventoID", "==", eventoId)
    );
    
    const lotesSnap = await getDocs(lotesQuery);
    
    if (lotesSnap.empty) {
      listaIngressos.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <p>Nenhum ingresso disponível para este evento</p>
        </div>
      `;
      return;
    }
    
    lotesDisponiveis = [];
    listaIngressos.innerHTML = "";
    
    lotesSnap.forEach((docLote) => {
      const lote = { id: docLote.id, ...docLote.data() };
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
        <p>Erro ao carregar ingressos</p>
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
  
  card.innerHTML = `
    ${badge}
    
    <h3>${lote.nome || "Ingresso"}</h3>
    
    <div class="lote-preco">
      <span class="label">Valor:</span>
      <span class="valor">${lote.preco ? lote.preco.toFixed(2) : "0.00"}</span>
    </div>
    
    <div class="lote-disponibilidade">
      <i class="fas fa-ticket-alt"></i>
      <div class="texto">
        <span class="qtdIngressos">${lote.quantidade || 0}</span> 
        ingresso(s) disponível(is)
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
  btnComprar.addEventListener("click", () => comprarIngresso(lote.id));
  
  return card;
}

/**
 * Processa compra do ingresso via API
 */
async function comprarIngresso(loteId) {
  if (!usuarioLogado) {
    alert("⚠️ Você precisa estar logado para comprar ingressos");
    window.location.href = "../login.html";
    return;
  }
  
  if (!eventoAtual) {
    alert("❌ Erro: Evento não carregado");
    return;
  }
  
  const btn = document.querySelector(`[data-lote-id="${loteId}"]`);
  const textoOriginal = btn.innerHTML;
  
  try {
    // Desabilita botão
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    
    console.log("🛒 Iniciando compra:", {
      usuarioID: usuarioLogado.uid,
      eventoID: eventoAtual.id,
      loteID: loteId
    });
    
    // ETAPA 1: Criar ingresso no banco (via API dados-compra)
    const responseDados = await fetch("/api/dados-compra", {
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
    
    const resultDados = await responseDados.json();
    
    if (!resultDados.success) {
      throw new Error(resultDados.message || "Erro ao criar ingresso");
    }
    
    console.log("✅ Ingresso criado:", resultDados.data.ingressoID);
    
    // ETAPA 2: Enviar email com PDF (via API comprar-ingresso)
    // Esta API será chamada em background pelo servidor
    // Para simplicidade, vamos apenas notificar que o email será enviado
    
    // Atualiza botão para sucesso
    btn.classList.add("sucesso");
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Compra Confirmada!';
    
    // Mostrar modal de sucesso
    mostrarModalSucesso(resultDados.data);
    
    // Recarregar lotes para atualizar quantidade
    setTimeout(() => {
      carregarLotes(eventoAtual.id);
    }, 2000);
    
  } catch (error) {
    console.error("❌ Erro na compra:", error);
    
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    
    alert(`❌ Erro ao processar compra:\n\n${error.message}`);
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
      
      <p><strong>Evento:</strong> ${dados.evento.titulo}</p>
      <p><strong>Lote:</strong> ${dados.lote.nome}</p>
      <p><strong>Valor:</strong> R$ ${dados.lote.preco}</p>
      <p><strong>Data:</strong> ${dados.evento.dataInicio}</p>
      <p><strong>Local:</strong> ${dados.evento.local}</p>
      
      <div class="info-email">
        <i class="fas fa-envelope"></i>
        <strong>Seu ingresso será enviado para:</strong><br>
        ${dados.usuario.email}
      </div>
      
      <p class="info-secundaria">
        <i class="fas fa-info-circle"></i>
        O PDF com o QR Code chegará em alguns minutos.
        Verifique também a caixa de spam.
      </p>
      
      <button onclick="this.closest('.mensagem-sucesso').remove()">
        <i class="fas fa-times"></i>
        Fechar
      </button>
      
      <a href="meusIngressos.html" class="btn" style="margin-top:10px;display:inline-block;">
        <i class="fas fa-ticket-alt"></i>
        Ver Meus Ingressos
      </a>
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
  // Pegar ID do evento da URL
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get("id");
  
  if (!eventoId) {
    tituloEl.textContent = "Erro";
    descricaoEl.textContent = "ID do evento não fornecido";
    listaIngressos.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Evento não especificado</p>
        <a href="home.html" class="btn">Voltar para Home</a>
      </div>
    `;
    return;
  }
  
  // Verificar autenticação
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("⚠️ Usuário não autenticado");
      // Permite ver o evento, mas não comprar
    } else {
      console.log("✅ Usuário autenticado:", user.uid);
      usuarioLogado = user;
      
      // Atualizar nome no header
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
    }
    
    // Carregar evento
    carregarEvento(eventoId);
  });
});