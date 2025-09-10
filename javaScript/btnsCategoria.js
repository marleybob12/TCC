// Seleciona todos os botões de categoria
const botoes = document.querySelectorAll(".btn-categoria");

botoes.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Pega o texto do botão (somente a categoria)
    const categoria = btn.textContent.trim().split("\n")[0]; 
    // Redireciona para categoria.html com query param
    window.location.href = `categoria.html?nome=${encodeURIComponent(categoria)}`;
  });
});
