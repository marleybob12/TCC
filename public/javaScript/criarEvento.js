import { auth, db } from "./firebaseConfig.js";
import { inserirDadosComOrganizador } from "./inserirDados.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elementos do DOM
const form = document.getElementById("formCriarEvento");
const listaIngressos = document.getElementById("listaIngressos");
const addIngressoBtn = document.getElementById("addIngressoBtn");
const mensagemEl = document.getElementById("mensagem");
const btnCriarEvento = document.getElementById("btnCriarEvento");
const loader = document.getElementById("loader");

let contadorIngressos = 0;

/**
 * Adiciona dinamicamente um novo ingresso ao formulário com design melhorado
 */
function adicionarIngresso(nome = "", preco = "", quantidade = "") {
  contadorIngressos++;
  
  const div = document.createElement("div");
  div.classList.add("ingresso-item");
  div.setAttribute("data-id", contadorIngressos);
  
  div.innerHTML = `
    <div class="ingresso-field">
      <label for="ingresso-nome-${contadorIngressos}">
        Nome do ingresso <span class="required">*</span>
      </label>
      <input 
        type="text" 
        id="ingresso-nome-${contadorIngressos}"
        placeholder="Ex: Pista, VIP, Camarote" 
        class="ingresso-nome" 
        value="${nome}" 
        required
      >
    </div>
    
    <div class="ingresso-field">
      <label for="ingresso-preco-${contadorIngressos}">
        Valor (R$) <span class="required">*</span>
      </label>
      <input 
        type="number" 
        id="ingresso-preco-${contadorIngressos}"
        placeholder="0.00" 
        class="ingresso-preco" 
        min="0" 
        step="0.01"
        value="${preco}" 
        required
      >
    </div>
    
    <div class="ingresso-field">
      <label for="ingresso-qtd-${contadorIngressos}">
        Quantidade <span class="required">*</span>
      </label>
      <input 
        type="number" 
        id="ingresso-qtd-${contadorIngressos}"
        placeholder="100" 
        class="ingresso-quantidade" 
        min="1" 
        value="${quantidade}" 
        required
      >
    </div>
    
    <button 
      type="button" 
      class="remover-btn" 
      title="Remover ingresso"
      aria-label="Remover ingresso"
    >
      <i class="fas fa-trash-alt"></i>
    </button>
  `;
  
  // Adiciona animação ao aparecer
  div.style.opacity = "0";
  div.style.transform = "translateY(-10px)";
  
  listaIngressos.appendChild(div);
  
  // Anima entrada
  setTimeout(() => {
    div.style.transition = "all 0.3s ease";
    div.style.opacity = "1";
    div.style.transform = "translateY(0)";
  }, 10);
  
  // Adiciona evento de remoção
  div.querySelector(".remover-btn").addEventListener("click", () => {
    // Anima saída
    div.style.opacity = "0";
    div.style.transform = "translateY(-10px)";
    setTimeout(() => div.remove(), 300);
  });
  
  // Formata o campo de preço automaticamente
  const campoPreco = div.querySelector(".ingresso-preco");
  campoPreco.addEventListener("blur", (e) => {
    if (e.target.value) {
      e.target.value = parseFloat(e.target.value).toFixed(2);
    }
  });
}

// Botão para adicionar ingresso
addIngressoBtn.addEventListener("click", () => {
  adicionarIngresso();
  
  // Scroll suave até o último ingresso
  setTimeout(() => {
    const ultimoIngresso = listaIngressos.lastElementChild;
    if (ultimoIngresso) {
      ultimoIngresso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
});

/**
 * Mostra mensagem de feedback para o usuário
 */
function mostrarMensagem(texto, tipo = "success") {
  mensagemEl.textContent = texto;
  mensagemEl.className = `mensagem ${tipo}`;
  mensagemEl.style.display = "block";
  
  // Remove mensagem após 5 segundos
  setTimeout(() => {
    mensagemEl.style.display = "none";
  }, 5000);
}

/**
 * Valida os dados do formulário
 */
function validarFormulario() {
  // Valida ingressos
  const ingressos = [];
  const ingressosItems = listaIngressos.querySelectorAll(".ingresso-item");
  
  if (ingressosItems.length === 0) {
    throw new Error("Adicione pelo menos um tipo de ingresso.");
  }
  
  ingressosItems.forEach((div, index) => {
    const nome = div.querySelector(".ingresso-nome").value.trim();
    const preco = parseFloat(div.querySelector(".ingresso-preco").value);
    const quantidade = parseInt(div.querySelector(".ingresso-quantidade").value, 10);
    
    if (!nome) {
      throw new Error(`O nome do ingresso ${index + 1} é obrigatório.`);
    }
    
    if (isNaN(preco) || preco < 0) {
      throw new Error(`O preço do ingresso "${nome}" deve ser um valor válido.`);
    }
    
    if (isNaN(quantidade) || quantidade < 1) {
      throw new Error(`A quantidade do ingresso "${nome}" deve ser pelo menos 1.`);
    }
    
    ingressos.push({ nome, preco, quantidade });
  });
  
  return ingressos;
}

// Verifica login do usuário e carrega dados
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "Usuario", user.uid));
    
    if (userDoc.exists()) {
      const dados = userDoc.data();
      
      // Atualiza interface
      document.querySelector(".user-name").textContent = dados.nome || "Usuário";
      
      // Preenche dados do organizador
      document.getElementById("nomeUsuario").value = dados.nome || "";
      document.getElementById("cpfUsuario").value = dados.cpf || "";
      document.getElementById("telefoneUsuario").value = dados.telefone || "";
      document.getElementById("dataNascimentoUsuario").value = dados.dataNascimento || "";
    }
  } catch (e) {
    console.error("Erro ao buscar dados do usuário:", e);
    mostrarMensagem("Erro ao carregar dados do usuário.", "error");
  }

  // Handler do formulário
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Limpa mensagens anteriores
      mensagemEl.style.display = "none";
      
      // Desabilita botão e mostra loader
      btnCriarEvento.disabled = true;
      loader.style.display = "block";
      
      try {
        // Valida e captura ingressos
        const ingressos = validarFormulario();
        
        // Captura dados do evento
        const eventoData = {
          nome: document.getElementById("nomeEvento").value.trim(),
          descricao: document.getElementById("descricaoEvento").value.trim(),
          data: document.getElementById("dataEvento").value,
          hora: document.getElementById("horaEvento").value,
          endereco: document.getElementById("rua").value.trim(),
          bairro: document.getElementById("bairro").value.trim(),
          cidade: document.getElementById("cidade").value.trim(),
          estado: document.getElementById("uf").value.trim(),
          numero: document.getElementById("numero").value.trim(),
          cep: document.getElementById("cepEvento").value.trim(),
          tipo: document.getElementById("tipoEvento").value.trim(),
          cnpj: document.getElementById("cnpjEvento").value.trim() || null,
          bannerUrl: document.getElementById("bannerUrlEvento").value.trim() || "",
          ingressos,
          dataCriacao: new Date()
        };
        
        // Validações básicas
        if (!eventoData.nome) throw new Error("O nome do evento é obrigatório.");
        if (!eventoData.data) throw new Error("A data do evento é obrigatória.");
        if (!eventoData.tipo) throw new Error("Selecione uma categoria para o evento.");
        
        // Insere no Firestore
        await inserirDadosComOrganizador(
          db,
          auth.currentUser.uid,
          document.getElementById("nomeUsuario").value,
          auth.currentUser.email,
          document.getElementById("telefoneUsuario").value,
          document.getElementById("cpfUsuario").value,
          document.getElementById("dataNascimentoUsuario").value,
          eventoData
        );
        
        // Sucesso!
        mostrarMensagem("✅ Evento criado com sucesso! Redirecionando...", "success");
        
        // Limpa formulário
        form.reset();
        listaIngressos.innerHTML = "";
        contadorIngressos = 0;
        
        // Redireciona após 2 segundos
        setTimeout(() => {
          window.location.href = "meusEventos.html";
        }, 2000);
        
      } catch (error) {
        console.error("Erro ao criar evento:", error);
        mostrarMensagem(error.message || "Erro ao criar evento. Tente novamente.", "error");
      } finally {
        btnCriarEvento.disabled = false;
        loader.style.display = "none";
      }
    });
  }
});

// Adiciona primeiro ingresso automaticamente ao carregar a página
window.addEventListener("load", () => {
  if (listaIngressos.children.length === 0) {
    adicionarIngresso("Ingresso Geral", "", "");
  }
});

// Preview do banner
document.getElementById("bannerUrlEvento")?.addEventListener("input", function () {
  const url = this.value.trim();
  const img = document.getElementById("previewBannerUrl");
  
  if (url) {
    img.src = url;
    img.style.display = "block";
    img.onerror = () => {
      img.style.display = "none";
      mostrarMensagem("URL da imagem inválida.", "error");
    };
  } else {
    img.style.display = "none";
  }
});
