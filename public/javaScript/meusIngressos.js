// meusIngressos.js - Integrado com Firebase
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const lista = document.getElementById("listaMeusIngressos");
const userAccount = document.getElementById("userAccount");
const dropdown = document.getElementById("dropdown");
const menuIcon = document.getElementById("menu-icon");
const navUl = document.querySelector(".nav-links ul");

// Dropdown
userAccount?.addEventListener("click", () => {
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", (event) => {
  if (userAccount && dropdown && !userAccount.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

// Menu mobile
menuIcon?.addEventListener("click", () => navUl?.classList.toggle("show"));

// Formata datas
function formatDate(timestamp) {
  if (!timestamp) return "A definir";
  if (timestamp.toDate) return timestamp.toDate().toLocaleString("pt-BR");
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString("pt-BR");
  return new Date(timestamp).toLocaleString("pt-BR");
}

// Carrega ingressos do usuário
async function carregarIngressos() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../login.html";
      return;
    }

    try {
      // Dados do usuário logado
      const userDoc = await getDoc(doc(db, "Usuario", user.uid));
      if (userDoc.exists()) {
        const userName = document.querySelector(".user-name");
        if (userName) userName.textContent = userDoc.data().nome || "Usuário";
      }

      // Buscar ingressos do usuário
      const ingressosQuery = query(
        collection(db, "Ingresso"),
        where("usuarioID", "==", user.uid)
      );

      const ingressosSnap = await getDocs(ingressosQuery);

      if (ingressosSnap.empty) {
        lista.innerHTML = "<p class='no-tickets'>Você ainda não possui ingressos.</p>";
        return;
      }

      // Agrupar por evento
      const ingressosPorEvento = {};
      const eventosIDs = new Set();

      ingressosSnap.forEach(docIngresso => {
        const ingresso = { id: docIngresso.id, ...docIngresso.data() };
        eventosIDs.add(ingresso.eventoID);

        if (!ingressosPorEvento[ingresso.eventoID]) {
          ingressosPorEvento[ingresso.eventoID] = [];
        }
        ingressosPorEvento[ingresso.eventoID].push(ingresso);
      });

      // Buscar dados dos eventos
      const eventos = {};
      const lotes = {};

      for (const eventoID of eventosIDs) {
        const eventoDoc = await getDoc(doc(db, "Evento", eventoID));
        if (eventoDoc.exists()) {
          eventos[eventoID] = { id: eventoID, ...eventoDoc.data() };
        }
      }

      // Buscar dados dos lotes
      for (const ingresso of ingressosSnap.docs.map(d => d.data())) {
        if (ingresso.loteID && !lotes[ingresso.loteID]) {
          const loteDoc = await getDoc(doc(db, "Lote", ingresso.loteID));
          if (loteDoc.exists()) {
            lotes[ingresso.loteID] = { id: ingresso.loteID, ...loteDoc.data() };
          }
        }
      }

      // Renderizar somente os ingressos
      renderizarIngressos(ingressosPorEvento, eventos, lotes, userDoc.data());

    } catch (err) {
      console.error("Erro ao carregar ingressos:", err);
      lista.innerHTML = "<p class='error'>❌ Erro ao carregar ingressos. Tente novamente.</p>";
    }
  });
}

// Renderiza SOMENTE os ingressos
function renderizarIngressos(ingressosPorEvento, eventos, lotes, usuario) {
  let html = "<h2>🎟️ Detalhes dos Ingressos</h2>";
  html += '<div id="listaTicketsDetalhados" class="tickets-container"></div>';

  lista.innerHTML = html;

  const ticketsContainer = document.getElementById("listaTicketsDetalhados");

  Object.keys(ingressosPorEvento).forEach(eventoID => {
    const evento = eventos[eventoID] || {};

    ingressosPorEvento[eventoID].forEach(ingresso => {
      const lote = lotes[ingresso.loteID] || {};

      const div = document.createElement("div");
      div.className = "ingresso-card card-glass";
      div.innerHTML = `
        <div class="ingresso-header">
          <h3>${evento.titulo || "Evento Desconhecido"}</h3>
          <span class="ingresso-status ${ingresso.status || 'ativo'}">${ingresso.status || "ativo"}</span>
        </div>

        <div class="ingresso-body">
          <p><b>🎫 Lote:</b> ${lote.nome || "Desconhecido"}</p>
          <p><b>💰 Valor:</b> R$ ${lote.preco ? lote.preco.toFixed(2) : "0.00"}</p>
          <p><b>📅 Data da Compra:</b> ${formatDate(ingresso.dataCompra)}</p>
          <p><b>🆔 ID:</b> ${ingresso.id}</p>
        </div>

        <div class="ingresso-footer">
          <button class="btn btn-download" data-ingresso='${JSON.stringify({
            id: ingresso.id,
            eventoTitulo: evento.titulo,
            loteNome: lote.nome,
            lotePreco: lote.preco,
            usuarioNome: usuario.nome,
            dataCompra: formatDate(ingresso.dataCompra),
            status: ingresso.status
          })}'>
            📄 Baixar Ingresso PDF
          </button>
        </div>
      `;
      ticketsContainer.appendChild(div);
    });
  });

  // Botão para gerar PDF
  document.querySelectorAll(".btn-download").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const ingressoData = JSON.parse(e.target.dataset.ingresso);
      await gerarPDFIngresso(ingressoData);
    });
  });
}

// Gera PDF do ingresso com jsPDF + QRCode
async function gerarPDFIngresso(ingresso) {
  try {
    const { jsPDF } = window.jspdf;
    const QRCode = window.QRCode;

    if (!jsPDF) {
      alert("Erro: Biblioteca jsPDF não carregada");
      return;
    }

    const doc = new jsPDF();

    // QR Code
    const qrData = `INGRESSO:${ingresso.id}|EVENTO:${ingresso.eventoTitulo}`;
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, qrData, { width: 200 });
    const qrImage = qrCanvas.toDataURL('image/png');

    // Conteúdo do PDF
    doc.setFontSize(20);
    doc.setTextColor(22, 115, 255);
    doc.text("🎟️ INGRESSO EVENTFLOW", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nome: ${ingresso.usuarioNome}`, 20, 40);
    doc.text(`Evento: ${ingresso.eventoTitulo}`, 20, 50);
    doc.text(`Lote: ${ingresso.loteNome}`, 20, 60);
    doc.text(`Valor: R$ ${ingresso.lotePreco.toFixed(2)}`, 20, 70);
    doc.text(`Data da Compra: ${ingresso.dataCompra}`, 20, 80);
    doc.text(`Status: ${ingresso.status}`, 20, 90);
    doc.text(`ID: ${ingresso.id}`, 20, 100);

    // QR code
    doc.addImage(qrImage, 'PNG', 75, 120, 60, 60);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Apresente este QR Code na entrada do evento", 105, 190, { align: "center" });

    const nomeArquivo = `Ingresso_${ingresso.eventoTitulo.replace(/[^a-zA-Z0-9]/g, '_')}_${ingresso.id}.pdf`;
    doc.save(nomeArquivo);

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar PDF. Verifique se as bibliotecas foram carregadas.");
  }
}

// Carrega bibliotecas jsPDF e QRCode
function carregarBibliotecas() {
  if (!document.getElementById('jspdf-script')) {
    const scriptJsPDF = document.createElement('script');
    scriptJsPDF.id = 'jspdf-script';
    scriptJsPDF.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(scriptJsPDF);
  }

  if (!document.getElementById('qrcode-script')) {
    const scriptQR = document.createElement('script');
    scriptQR.id = 'qrcode-script';
    scriptQR.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
    document.head.appendChild(scriptQR);
  }
}

// Inicializa
carregarBibliotecas();
carregarIngressos();
