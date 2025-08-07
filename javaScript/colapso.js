  <!-- Script do Acordeão -->
  <script>
    const botoes = document.querySelectorAll('.acordeao-titulo');
    botoes.forEach(botao => {
      botao.addEventListener('click', () => {
        const item = botao.parentElement;
        item.classList.toggle('ativo');
      });
    });
  </script>
