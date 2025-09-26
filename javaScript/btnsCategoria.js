// btnsCategoria.js
const botoes = document.querySelectorAll(".btn-categoria");

botoes.forEach((btn) => {
  btn.addEventListener("click", () => {
    const categoria = btn.textContent.trim().split("\n")[0];
    window.location.href = `categoria.html?nome=${encodeURIComponent(categoria)}`;
  });
});
