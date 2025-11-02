import { auth, db } from "./firebaseConfig.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const BACKEND_URL = 'https://tcc-puce-three.vercel.app/';

const params = new URLSearchParams(window.location.search);
const eventoID = params.get("id");

const titulo = document.getElementById("tituloEvento");
const banner = document.getElementById("bannerEvento");
const descricao = document.getElementById("descricaoEvento");
const dataEvento = document.getElementById("dataEvento");
const listaIngressos = document.getElementById("listaIngressos");

function formatDate(timestamp) {
  if (!timestamp) return "A definir";
  if (timestamp.toDate) return timestamp.toDate().toLocaleDateString("pt-BR");
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

async function carregarEvento() {
  try {
    if (!eventoID) {
      listaIngressos.innerHTML = "<p class='error'>ID do evento não encontrado.</p>";
      return;
    }

    const eventoDoc = await getDoc(doc(db, "Evento", eventoID));
    if (!eventoDoc.exists()) {
      listaIngressos.innerHTML = "<p class='error'>Evento não encontrado.</p>";
      return;
    }

    const evento = eventoDoc.data();

    titulo.textContent = evento.titulo || "Evento";
    banner.src = evento.imagemBanner || "../img/evento.jpg";
    banner.alt = evento.titulo || "Banner do Evento";
    descricao.textContent = evento.descricao || "Sem descrição disponível";
    dataEvento.textContent = formatDate(evento.dataInicio);

    const lotesQuery = query(collection(db, "Lote"), where("eventoID", "==", eventoID));
    const lotesSnap = await getDocs(lotesQuery);

    if (lotesSnap.empty) {
      listaIngressos.innerHTML = "<p>Nenhum ingresso disponível no momento.</p>";
      return;
    }

    listaIngressos.innerHTML = "";

    lotesSnap.forEach(loteDoc => {
      const lote = loteDoc.data();
      const loteID = loteDoc.id;
      const disponivel = (lote.quantidade > 0);

      const div = document.createElement("div");
      div.classList.add("lote-card");
      div.innerHTML = `
        <h3>${lote.nome}</h3>
        <p><b>Preço:</b> R$ ${lote.preco.toFixed(2)}</p>
        <p><b>Disponível:</b> ${lote.quantidade} ${lote.quantidade === 1 ? 'ingresso' : 'ingressos'}</p>
        <button 
          class="btnComprar" 
          data-lote="${loteID}" 
          data-evento="${eventoID}"
          ${!disponivel ? 'disabled' : ''}
        >
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

function adicionarEventosCompra() {
  document.querySelectorAll(".btnComprar").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const button = e.target;
      const loteID = button.dataset.lote;
      const eventoIDCompra = button.dataset.evento;

      button.disabled = true;
      button.textContent = "⏳ Processando...";

      try {
        await comprarIngresso(eventoIDCompra, loteID);
      } catch (error) {
        console.error("Erro na compra:", error);
        alert("Erro ao processar compra: " + error.message);
        button.disabled = false;
        button.textContent = "🎟️ Comprar";
      }
    });
  });
}

async function comprarIngresso(eventoID, loteID) {
  // Promisify onAuthStateChanged to wait user state
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Você precisa estar logado para comprar ingressos.");
        window.location.href = "../login.html";
        return reject(new Error("Usuário não autenticado"));
      }

      try {
        const response = await fetch(`${BACKEND_URL}/comprar-ingresso`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioID: user.uid,
            eventoID: eventoID,
            loteID: loteID,
          }),
        });

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();

          if (!response.ok) throw new Error(result.message || "Erro ao processar compra");

          if (result.success) {
            alert(`✅ ${result.message}\n\n📧 Um email com o ingresso em PDF foi enviado para você!`);
            setTimeout(() => window.location.reload(), 2000);
            resolve(result);
          } else {
            throw new Error(result.message || "Falha na compra");
          }
        } else {
          const text = await response.text();
          throw new Error("Resposta inválida do servidor: " + text);
        }

      } catch (error) {
        console.error("Erro na requisição:", error);
        reject(error);
      }
    });
  });
}

carregarEvento();
