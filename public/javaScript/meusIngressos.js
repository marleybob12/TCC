function renderizarIngressos(ingressosPorEvento, eventos, lotes, usuario) {
  let html = `
    <h2><i class="fa-solid fa-ticket"></i> Detalhes dos Ingressos</h2>
  `;
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

  document.querySelectorAll(".btn-download").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const ingressoData = JSON.parse(e.target.dataset.ingresso);
      await gerarPDFIngresso(ingressoData);
    });
  });
}
