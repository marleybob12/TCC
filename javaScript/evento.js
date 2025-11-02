// evento.js
const params = new URLSearchParams(window.location.search);
const eventoID = params.get("id");

const titulo = document.getElementById("tituloEvento");
const banner = document.getElementById("bannerEvento");
const descricao = document.getElementById("descricaoEvento");
const dataEvento = document.getElementById("dataEvento");
const listaIngressos = document.getElementById("listaIngressos");

async function carregarEvento() {
  try {
    const res = await fetch(`https://SEU_BACKEND.vercel.app/api/evento/${eventoID}`);
    const data = await res.json();

    titulo.textContent = data.evento.titulo;
    banner.src = data.evento.bannerURL || "";
    descricao.textContent = data.evento.descricao;
    dataEvento.textContent = data.evento.dataInicio;

    listaIngressos.innerHTML = "";
    data.lotes.forEach(lote => {
      const div = document.createElement("div");
      div.classList.add("lote-card");
      div.innerHTML = `
        <p><b>Lote:</b> ${lote.nome}</p>
        <p><b>Preço:</b> R$ ${lote.preco.toFixed(2)}</p>
        <button class="btnComprar" data-lote="${lote.id}">🎟 Comprar</button>
      `;
      listaIngressos.appendChild(div);
    });

    document.querySelectorAll(".btnComprar").forEach(btn => {
      btn.addEventListener("click", async () => {
        const loteID = btn.dataset.lote;
        const token = localStorage.getItem("userToken");
        await fetch(`https://SEU_BACKEND.vercel.app/api/comprarIngresso`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, eventoID, loteID })
        });
        alert("Ingresso comprado com sucesso!");
      });
    });

  } catch (err) {
    console.error(err);
    listaIngressos.innerHTML = "<p>Erro ao carregar o evento.</p>";
  }
}

carregarEvento();
