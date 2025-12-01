/**
 * loadHeader.js - Carregador Universal de Header
 * Versão 2.0 - Corrigida e Otimizada
 */

(function() {
  'use strict';

  /**
   * Detecta todos os possíveis caminhos do header
   */
  function detectarCaminhosHeader() {
    const currentPath = window.location.pathname;
    
    // Lista completa de caminhos a tentar
    const caminhos = [
      './header.html',              // Mesma pasta
      '../home/header.html',        // Pasta acima > home
      './home/header.html',         // Subpasta home
      '../../home/header.html',     // Dois níveis acima > home
      '/public/home/header.html',   // Caminho absoluto
      '../../../public/home/header.html' // Três níveis acima
    ];

    // Adiciona caminho baseado na estrutura atual
    if (currentPath.includes('/organizador/')) {
      caminhos.unshift('../home/header.html');
    } else if (currentPath.includes('/home/')) {
      caminhos.unshift('./header.html');
    } else if (currentPath.includes('/public/')) {
      caminhos.unshift('./home/header.html');
    }

    return caminhos;
  }

  /**
   * Tenta carregar o header de múltiplos caminhos
   */
  async function tentarCarregarHeader() {
    const caminhos = detectarCaminhosHeader();
    
    for (const caminho of caminhos) {
      try {
        const response = await fetch(caminho);
        if (response.ok) {
          const html = await response.text();
          console.log(`✅ Header carregado de: ${caminho}`);
          return html;
        }
      } catch (error) {
        // Continua tentando próximo caminho
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
      
      // Remove headers soltos existentes
      document.querySelectorAll('header').forEach(h => {
        if (!h.closest('#header-placeholder')) {
          h.remove();
        }
      });
      
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
   * Inicializa scripts do header após carregamento
   */
  function inicializarScriptsHeader(placeholder) {
    // Processa scripts inline
    const scripts = placeholder.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // Copia atributos
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copia conteúdo ou src
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      
      // Substitui
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Ajusta caminhos relativos no HTML do header
   */
  function ajustarCaminhos(html, caminhoUsado) {
    // Se o header foi carregado de um caminho diferente,
    // pode ser necessário ajustar os caminhos das imagens/links
    
    // Por enquanto, mantemos os caminhos relativos ao header
    // pois eles já estão corretos em header.html
    return html;
  }

  /**
   * Adiciona espaçamento no body para o header fixo
   */
  function ajustarEspacamento() {
    if (!document.body.style.paddingTop || document.body.style.paddingTop === '0px') {
      document.body.style.paddingTop = '85px'; // Altura do header
    }
  }

  /**
   * Função principal de carregamento
   */
  async function carregarHeader() {
    try {
      // 1. Garante placeholder
      const placeholder = garantirPlaceholder();

      // 2. Mostra loading
      placeholder.innerHTML = `
        <div style="padding:10px;text-align:center;background:#f0f0f0;border-bottom:1px solid #ddd;">
          <i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>
          Carregando menu...
        </div>
      `;

      // 3. Carrega header
      const html = await tentarCarregarHeader();

      // 4. Insere o HTML
      placeholder.innerHTML = html;

      // 5. Inicializa scripts
      inicializarScriptsHeader(placeholder);

      // 6. Ajusta espaçamento do body
      ajustarEspacamento();

      // 7. Dispara evento customizado
      window.dispatchEvent(new CustomEvent('headerLoaded'));

      console.log('✅ Header inicializado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar header:', error);
      
      // Fallback: mostra mensagem de erro amigável
      const placeholder = document.getElementById('header-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div style="padding:20px;background:#fee;color:#c00;text-align:center;border-bottom:3px solid #c00;">
            <strong>⚠️ Erro ao carregar o menu de navegação</strong>
            <br>
            <small>Tentando recarregar...</small>
            <br><br>
            <a href="../home/home.html" style="color:#c00;text-decoration:underline;font-weight:bold;">
              Voltar para Home
            </a>
          </div>
        `;
        
        // Tenta recarregar após 2 segundos
        setTimeout(() => {
          if (placeholder.innerHTML.includes('Erro ao carregar')) {
            window.location.reload();
          }
        }, 2000);
      }
    }
  }

  /**
   * Aguarda FontAwesome carregar antes de inicializar
   */
  function aguardarFontAwesome() {
    return new Promise((resolve) => {
      if (document.querySelector('link[href*="font-awesome"]')) {
        resolve();
      } else {
        // Adiciona FontAwesome se não existir
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
        document.head.appendChild(link);
        link.onload = resolve;
      }
    });
  }

  /**
   * Inicialização
   */
  async function init() {
    await aguardarFontAwesome();
    await carregarHeader();
  }

  // Executa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expõe função globalmente para recarregar manualmente
  window.recarregarHeader = carregarHeader;

})();