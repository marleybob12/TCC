/**
 * loadHeader.js - Carregador Universal de Header
 * Detecta automaticamente o caminho correto do header.html
 * Funciona em qualquer nível de pasta do projeto
 */


(function() {
  'use strict';


  /**
   * Detecta o caminho correto do header.html baseado na estrutura do projeto
   */
  function detectarCaminhoHeader() {
    const currentPath = window.location.pathname;
   
    // Mapeamento de caminhos conhecidos
    const pathMappings = {
      '/public/home/': './header.html',
      '/home/': './header.html',
      '/public/': './home/header.html',
      '/': './public/home/header.html'
    };


    // Tenta encontrar um mapeamento conhecido
    for (const [path, headerPath] of Object.entries(pathMappings)) {
      if (currentPath.includes(path)) {
        return headerPath;
      }
    }


    // Detecção automática: tenta diferentes níveis
    const tentativas = [
      './header.html',           // Mesma pasta
      '../home/header.html',     // Pasta acima + /home
      './home/header.html',      // Subpasta /home
      '../../home/header.html'   // Dois níveis acima
    ];


    return tentativas;
  }


  /**
   * Tenta carregar o header de múltiplos caminhos
   */
  async function tentarCarregarHeader(caminhos) {
    const paths = Array.isArray(caminhos) ? caminhos : [caminhos];
   
    for (const caminho of paths) {
      try {
        const response = await fetch(caminho);
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn(`Tentativa falhou: ${caminho}`);
      }
    }
   
    throw new Error('Header não encontrado em nenhum caminho');
  }


  /**
   * Garante que existe um placeholder para o header
   */
  function garantirPlaceholder() {
    let placeholder = document.getElementById('header-placeholder');
   
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.id = 'header-placeholder';
     
      // Insere no início do body
      if (document.body.firstChild) {
        document.body.insertBefore(placeholder, document.body.firstChild);
      } else {
        document.body.appendChild(placeholder);
      }
    }
   
    return placeholder;
  }


  /**
   * Remove headers antigos que possam existir
   */
  function removerHeadersAntigos() {
    document.querySelectorAll('header').forEach(header => {
      // Não remove o header se ele está dentro do placeholder
      if (!header.closest('#header-placeholder')) {
        header.remove();
      }
    });
  }


  /**
   * Inicializa scripts do header após carregamento
   */
  function inicializarScriptsHeader() {
    // Reexecuta scripts inline do header (se houver)
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) return;


    const scripts = placeholder.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
     
      // Copia atributos
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
     
      // Copia conteúdo
      newScript.textContent = oldScript.textContent;
     
      // Substitui
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });


    // Dispara evento customizado para outros scripts saberem que o header foi carregado
    window.dispatchEvent(new CustomEvent('headerLoaded'));
  }


  /**
   * Função principal de carregamento
   */
  async function carregarHeader() {
    try {
      // 1. Remove headers antigos
      removerHeadersAntigos();


      // 2. Garante placeholder
      const placeholder = garantirPlaceholder();


      // 3. Mostra loading
      placeholder.innerHTML = '<div style="padding:10px;text-align:center;">Carregando...</div>';


      // 4. Detecta caminho e carrega
      const caminhos = detectarCaminhoHeader();
      const html = await tentarCarregarHeader(caminhos);


      // 5. Insere o HTML
      placeholder.innerHTML = html;


      // 6. Inicializa scripts
      inicializarScriptsHeader();


      console.log('✅ Header carregado com sucesso');


    } catch (error) {
      console.error('❌ Erro ao carregar header:', error);
     
      // Fallback: mostra mensagem de erro amigável
      const placeholder = document.getElementById('header-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div style="padding:20px;background:#fee;color:#c00;text-align:center;border-radius:8px;margin:10px;">
            ⚠️ Erro ao carregar o menu de navegação.
            <a href="../home/home.html" style="color:#c00;text-decoration:underline;">Voltar para Home</a>
          </div>
        `;
      }
    }
  }


  // Executa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregarHeader);
  } else {
    carregarHeader();
  }


  // Expõe função globalmente (opcional)
  window.recarregarHeader = carregarHeader;


})();
