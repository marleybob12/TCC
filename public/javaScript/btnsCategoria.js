// ===========================
// NAVEGAÇÃO POR CATEGORIA
// ===========================

document.addEventListener('DOMContentLoaded', function() {
  
  // Selecionar todos os botões de categoria
  const botoesCategoria = document.querySelectorAll('.btn-categoria');
  
  // Adicionar evento de clique em cada botão
  botoesCategoria.forEach(botao => {
    botao.addEventListener('click', function() {
      // Pegar o texto do botão (nome da categoria)
      // Remove o ícone e pega apenas o texto
      const textoCompleto = this.textContent.trim();
      const nomeCategoria = textoCompleto;
      
      // Redirecionar para a página de categoria com o nome como parâmetro
      window.location.href = `categoria.html?nome=${encodeURIComponent(nomeCategoria)}`;
    });
    
    // Adicionar efeito visual de hover
    botao.style.cursor = 'pointer';
    botao.style.transition = 'all 0.3s ease';
    
    botao.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.3)';
    });
    
    botao.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
  });

  // ===========================
  // NAVEGAÇÃO POR CIDADE
  // ===========================
  
  // Selecionar todos os cards de cidade
  const cardsCidade = document.querySelectorAll('.card-cidade');
  
  cardsCidade.forEach(card => {
    card.addEventListener('click', function() {
      const cidade = this.getAttribute('data-cidade');
      window.location.href = `categoria.html?local=${encodeURIComponent(cidade)}`;
    });
    
    // Adicionar efeito visual
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.3s ease';
    
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
      this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    });
  });

  // ===========================
  // MELHORIAS DE ACESSIBILIDADE
  // ===========================
  
  // Adicionar feedback visual quando um botão é focado (teclado)
  const elementosClicaveis = [...botoesCategoria, ...cardsCidade];
  
  elementosClicaveis.forEach(elemento => {
    elemento.setAttribute('tabindex', '0');
    elemento.setAttribute('role', 'button');
    
    // Permitir navegação por teclado (Enter e Space)
    elemento.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  // ===========================
  // LOG PARA DEBUG (opcional)
  // ===========================
  
  console.log(`✅ ${botoesCategoria.length} botões de categoria configurados`);
  console.log(`✅ ${cardsCidade.length} cards de cidade configurados`);
  
});