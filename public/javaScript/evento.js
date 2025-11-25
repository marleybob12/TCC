import { auth, db } from "./firebaseConfig.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const BACKEND_URL = 'https://tcc-puce-three.vercel.app';
const params = new URLSearchParams(window.location.search);
const eventoID = params.get("id");

const titulo = document.getElementById("tituloEvento");
const banner = document.getElementById("bannerEvento");
const descricao = document.getElementById("descricaoEvento");
const dataEvento = document.getElementById("dataEvento");
const listaIngressos = document.getElementById("listaIngressos");

let usuarioAtual = null;

// Formata datas do Firestore
function formatDate(timestamp) {
  if (!timestamp) return "A definir";
  if (timestamp.toDate) return timestamp.toDate().toLocaleDateString("pt-BR");
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

// Carrega evento e lotes
async function carregarEvento() {
  try {
    if (!eventoID) return listaIngressos.innerHTML = "<p class='error'>ID do evento não encontrado.</p>";

    const eventoDoc = await getDoc(doc(db, "Evento", eventoID));
    if (!eventoDoc.exists()) return listaIngressos.innerHTML = "<p class='error'>Evento não encontrado.</p>";

    const evento = eventoDoc.data();
    titulo.textContent = evento.titulo || "Evento";
    banner.src = evento.imagemBanner || "../img/evento.jpg";
    banner.alt = evento.titulo || "Banner do Evento";
    descricao.textContent = evento.descricao || "Sem descrição disponível";
    dataEvento.textContent = formatDate(evento.dataInicio);

    const lotesSnap = await getDocs(query(collection(db, "Lote"), where("eventoID", "==", eventoID)));
    if (lotesSnap.empty) return listaIngressos.innerHTML = "<p>Nenhum ingresso disponível no momento.</p>";

    listaIngressos.innerHTML = "";
    lotesSnap.forEach(loteDoc => {
      const lote = loteDoc.data();
      const disponivel = lote.quantidade > 0;
      const div = document.createElement("div");
      div.classList.add("lote-card");
      div.innerHTML = `
        <h3>${lote.nome}</h3>
        <p><b>Preço:</b> R$ ${lote.preco.toFixed(2)}</p>
        <p><b>Disponível:</b> <span class="qtdIngressos">${lote.quantidade}</span> ${lote.quantidade === 1 ? 'ingresso' : 'ingressos'}</p>
        <button class="btnComprar" data-lote="${loteDoc.id}" data-evento="${eventoID}" ${!disponivel ? 'disabled' : ''}>
          ${disponivel ? '🎟️ Comprar' : '❌ Esgotado'}
        </button>
      `;
      listaIngressos.appendChild(div);
    });

    adicionarEventosCompra();

  } catch (err) {
    console.error("Erro ao carregar evento:", err);
    listaIngressos.innerHTML = "<p class='error'>Erro ao carregar o evento. Tente novamente.</p>";
  }
}

// Botões de compra
function adicionarEventosCompra() {
  document.querySelectorAll(".btnComprar").forEach(btn => {
    btn.addEventListener("click", async e => {
      const button = e.target;
      const loteID = button.dataset.lote;
      const eventoIDCompra = button.dataset.evento;

      if (!usuarioAtual) {
        alert("Você precisa estar logado para comprar ingressos.");
        window.location.href = "../login.html";
        return;
      }

      button.disabled = true;
      button.textContent = "⏳ Processando...";

      try {
        const result = await comprarIngresso(eventoIDCompra, loteID);
        if (result.success) {
          button.textContent = "✅ Comprado!";
          button.classList.add("sucesso");

          const qtdSpan = button.parentElement.querySelector(".qtdIngressos");
          let qtd = parseInt(qtdSpan.textContent);
          qtd = Math.max(qtd - 1, 0);
          qtdSpan.textContent = qtd;
          if (qtd === 0) button.textContent = "❌ Esgotado";

          // Mostrar mensagem de sucesso
          mostrarMensagemSucesso(result.data);
        }
      } catch (error) {
        console.error("Erro na compra:", error);
        alert("Erro ao processar compra: " + error.message);
        button.disabled = false;
        button.textContent = "🎟️ Comprar";
      }
    });
  });
}

// Mostrar mensagem de sucesso
function mostrarMensagemSucesso(data) {
  const mensagem = document.createElement("div");
  mensagem.className = "mensagem-sucesso";
  mensagem.innerHTML = `
    <div class="mensagem-conteudo">
      <h3>✅ Compra realizada com sucesso!</h3>
      <p><strong>Evento:</strong> ${data.evento.titulo}</p>
      <p><strong>Lote:</strong> ${data.lote.nome}</p>
      <p><strong>Valor:</strong> R$ ${data.lote.preco}</p>
      <p class="info-email">📧 Seu ingresso será enviado por email em breve para: <strong>${data.usuario.email}</strong></p>
      <p class="info-secundaria">O processamento pode levar alguns minutos</p>
      <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
    </div>
  `;
  
  document.body.appendChild(mensagem);
  
  // Auto-remover após 10 segundos
  setTimeout(() => mensagem.remove(), 10000);
}

// Compra - agora usa a nova API
async function comprarIngresso(eventoID, loteID) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/dados-compra`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        usuarioID: usuarioAtual.uid, 
        eventoID, 
        loteID 
      }),
    });

    const contentType = response.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Resposta não-JSON:", text);
      throw new Error("Resposta inválida do servidor. Por favor, tente novamente.");
    }

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Erro HTTP ${response.status}`);
    }
    
    return result;

  } catch (error) {
    console.error("Erro detalhado na compra:", error);
    throw error;
  }
}

// Observa usuário
onAuthStateChanged(auth, (user) => {
  usuarioAtual = user;
  if (!user) {
    document.querySelectorAll(".btnComprar").forEach(btn => {
      btn.disabled = true;
      btn.textContent = "🔒 Faça login";
    });
  }
});

// Adiciona CSS para a mensagem
const style = document.createElement('style');
style.textContent = `
  .mensagem-sucesso {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  }
  
  .mensagem-conteudo {
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 500px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  }
  
  .mensagem-conteudo h3 {
    color: #10b981;
    margin-top: 0;
    font-size: 1.5rem;
  }
  
  .mensagem-conteudo p {
    margin: 10px 0;
  }
  
  .info-email {
    background: #f0fdf4;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid #10b981;
    margin: 15px 0;
  }
  
  .info-secundaria {
    color: #6b7280;
    font-size: 0.9rem;
    font-style: italic;
  }
  
  .mensagem-conteudo button {
    background: #1E40AF;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 15px;
    width: 100%;
  }
  
  .mensagem-conteudo button:hover {
    background: #1e3a8a;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Inicializa
carregarEvento();