// meusIngressos.js
import jsPDF from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";

const lista = document.getElementById("listaMeusIngressos");
const userAccount = document.getElementById("userAccount");
const dropdown = document.getElementById("dropdown");
const menuIcon = document.getElementById("menu-icon");
const navUl = document.querySelector(".nav-links ul");

// Dropdown
userAccount.addEventListener("click", () => {
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", (event) => {
  if (!userAccount.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

// Menu mobile
menuIcon.addEventListener("click", () => navUl.classList.toggle("show"));

// Carrega ingressos via backend Vercel
async function carregarIngressos() {
  const token = localStorage.getItem("userToken");
  if (!token) return window.location.href = "../login.html";

  try {
    const res = await fetch(`https://SEU_BACKEND.vercel.app/api/ingressos?token=${token}`);
    const data = await res.json();

    if (!data.ingressos || data.ingressos.length === 0) {
      lista.innerHTML = "<p>Você ainda não possui ingressos.</p>";
      return;
    }

    // Eventos únicos
    const eventoIDs = [...new Set(data.ingressos.map(i => i.eventoID))];

    let html = "<h2>Eventos que você participa</h2>";
    html += '<div id="meusEventosParticipando" style="display:flex; flex-direction:column;"></div>';
    html += "<hr />";
    html += "<h2>Seus ingressos</h2>";
    html += '<div id="listaTicketsDetalhados"></div>';
    lista.innerHTML = html;

    const eventosContainer = document.getElementById("meusEventosParticipando");
    const listaTicketsDetalhados = document.getElementById("listaTicketsDetalhados");

    // Cartões de eventos
    for (const eventoID of eventoIDs) {
      const evento = data.eventos.find(e => e.id === eventoID) || {};
      const card = document.createElement("div");
      card.className = "card-glass";
      card.style.margin = "8px 0";
      card.style.padding = "12px";
      card.innerHTML = `
        <h3>${evento.titulo || "Evento Desconhecido"}</h3>
        <p><b>Data:</b> ${evento.dataInicio || "A definir"}</p>
        <p><b>Status:</b> ${evento.status || "A definir"}</p>
        <a class="btn" href="evento.html?id=${eventoID}">🔍 Ver Detalhes</a>
      `;
      eventosContainer.appendChild(card);
    }

    // Lista detalhada de ingressos
    for (const ingresso of data.ingressos) {
      const evento = data.eventos.find(e => e.id === ingresso.eventoID) || {};
      const lote = data.lotes.find(l => l.id === ingresso.loteID) || {};

      const div = document.createElement("div");
      div.classList.add("ingresso-card");
      div.style.border = "1px solid #ccc";
      div.style.borderRadius = "10px";
      div.style.padding = "15px";
      div.style.margin = "10px 0";
      div.innerHTML = `
        <h3>${evento.titulo || "Evento Desconhecido"}</h3>
        <p><b>Ingresso:</b> ${lote.nome || "Lote desconhecido"}</p>
        <p><b>Preço:</b> R$ ${lote.preco ? lote.preco.toFixed(2) : "?"}</p>
        <p><b>Status:</b> ${ingresso.status || "ativo"}</p>
        <button class="btnPDF">📄 Baixar PDF</button>
      `;

      div.querySelector(".btnPDF").addEventListener("click", () => {
        gerarPDF(data.usuario, evento, lote, ingresso);
      });

      listaTicketsDetalhados.appendChild(div);
    }

  } catch (err) {
    console.error(err);
    lista.innerHTML = "<p>❌ Erro ao carregar ingressos. Tente novamente mais tarde.</p>";
  }
}

// PDF + QR Code
async function gerarPDF(usuario, evento, lote, ingresso) {
  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF();

  const qrData = `IngressoID:${ingresso.id}|Usuario:${usuario.uid}|Evento:${ingresso.eventoID}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);

  docPDF.setFontSize(18);
  docPDF.text("🎟 Ingresso EventFlow", 20, 20);
  docPDF.setFontSize(12);
  docPDF.text(`Nome: ${usuario.nome || "Usuário"}`, 20, 40);
  docPDF.text(`Evento: ${evento.titulo || "Evento Desconhecido"}`, 20, 50);
  docPDF.text(`Ingresso: ${lote.nome || "Lote Desconhecido"}`, 20, 60);
  docPDF.text(`Preço: R$ ${lote.preco ? lote.preco.toFixed(2) : "?"}`, 20, 70);
  docPDF.text(`Status: ${ingresso.status || "ativo"}`, 20, 80);
  docPDF.text(`Data da Compra: ${ingresso.dataCompra || "-"}`, 20, 90);
  docPDF.addImage(qrCodeDataURL, "PNG", 20, 110, 60, 60);
  docPDF.setFontSize(10);
  docPDF.text("Apresente este ingresso com QR Code na entrada do evento.", 20, 180);

  const safeEventoName = (evento.titulo || "evento").replace(/[^\w\d-_ ]/g, "");
  const safeLoteName = (lote.nome || "lote").replace(/[^\w\d-_ ]/g, "");
  docPDF.save(`Ingresso_${safeEventoName}_${safeLoteName}.pdf`);
}

carregarIngressos();
