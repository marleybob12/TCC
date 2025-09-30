/**
 * Adiciona funcionalidade de colapso aos itens com classe 'acordeao-titulo'.
 */
document.addEventListener('DOMContentLoaded', () => {
  const botoes = document.querySelectorAll('.acordeao-titulo');
  botoes.forEach(botao => {
    botao.addEventListener('click', () => {
      const item = botao.parentElement;
      item.classList.toggle('ativo');
    });
  });
});