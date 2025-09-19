// Seleciona todos os botões de categoria
const botoes = document.querySelectorAll(".btn-categoria");

/**
 * Adiciona evento de clique aos botões de categoria.
 * Redireciona para a página de categoria com o nome da categoria como parâmetro.
 */
botoes.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Pega o texto do botão (somente a categoria)
    const categoria = btn.textContent.trim().split("\n")[0]; 
    // Redireciona para categoria.html com query param
    window.location.href = `categoria.html?nome=${encodeURIComponent(categoria)}`;
  });
});
