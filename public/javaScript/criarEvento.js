import { auth, db } from "./firebaseConfig.js";
import { inserirDadosComOrganizador } from "./inserirDados.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("formCriarEvento");
const listaIngressos = document.getElementById("listaIngressos");
const addIngressoBtn = document.getElementById("addIngressoBtn");
const mensagemEl = document.getElementById("mensagem");
const btnCriarEvento = document.getElementById("btnCriarEvento");
const loader = document.getElementById("loader");

let contadorIngressos = 0;

/**
 * Formata data para o input type="datetime-local"
 */
function formatarDataLocal(date) {
  if (!date) return "";
  const d = new Date(date);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}

/**
 * Calcula tempo restante até uma data
 */
function calcularTempoRestante(dataFim) {
  const agora = new Date();
  const diff = new Date(dataFim) - agora;
  
  if (diff <= 0) return { disponivel: false, texto: "Prazo expirado" };
  
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  let texto = "";
  if (dias > 0) texto += `${dias}d `;
  if (horas > 0) texto += `${horas}h `;
  if (minutos > 0) texto += `${minutos}m`;
  
  return { disponivel: true, texto: texto.trim() || "Menos de 1 minuto" };
}

/**
 * Adiciona dinamicamente um novo ingresso com campos de data/hora
 */
function adicionarIngresso(nome = "", preco = "", quantidade = "", dataInicio = "", dataFim = "") {
  contadorIngressos++;
  
  const div = document.createElement("div");
  div.classList.add("ingresso-item");
  div.setAttribute("data-id", contadorIngressos);
  
  const dataInicioFormatada = formatarDataLocal(dataInicio);
  const dataFimFormatada = formatarDataLocal(dataFim);
  
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

    <div class="ingresso-field">
      <label for="ingresso-inicio-${contadorIngressos}">
        Início da venda <span class="required">*</span>
      </label>
      <input 
        type="datetime-local" 
        id="ingresso-inicio-${contadorIngressos}"
        class="ingresso-data-inicio" 
        value="${dataInicioFormatada}"
        required
      >
      <small class="helper-text">Quando as vendas deste ingresso começam</small>
    </div>

    <div class="ingresso-field">
      <label for="ingresso-fim-${contadorIngressos}">
        Fim da venda <span class="required">*</span>
      </label>
      <input 
        type="datetime-local" 
        id="ingresso-fim-${contadorIngressos}"
        class="ingresso-data-fim" 
        value="${dataFimFormatada}"
        required
      >
      <small class="helper-text">Quando as vendas deste ingresso terminam</small>
    </div>

    <div class="ingresso-field">
      <label>Tempo restante:</label>
      <div class="tempo-restante" style="padding: 8px; background: #f3f4f6; border-radius: 6px; color: #6b7280;">
        <small>Será atualizado automaticamente</small>
      </div>
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
  
  div.style.opacity = "0";
  div.style.transform = "translateY(-10px)";
  
  listaIngressos.appendChild(div);
  
  setTimeout(() => {
    div.style.transition = "all 0.3s ease";
    div.style.opacity = "1";
    div.style.transform = "translateY(0)";
  }, 10);
  
  // Remoção
  div.querySelector(".remover-btn").addEventListener("click", () => {
    div.style.opacity = "0";
    div.style.transform = "translateY(-10px)";
    setTimeout(() => div.remove(), 300);
  });
  
  // Formata preço
  const campoPreco = div.querySelector(".ingresso-preco");
  campoPreco.addEventListener("blur", (e) => {
    if (e.target.value) {
      e.target.value = parseFloat(e.target.value).toFixed(2);
    }
  });

  // Atualiza tempo restante
  const campoFim = div.querySelector(".ingresso-data-fim");
  const tempoDiv = div.querySelector(".tempo-restante");
  
  const atualizarTempo = () => {
    const dataFim = campoFim.value;
    if (dataFim) {
      const { disponivel, texto } = calcularTempoRestante(dataFim);
      tempoDiv.innerHTML = `<small>${disponivel ? '⏱️ Disponível por: ' : '⏸️ '}${texto}</small>`;
    }
  };
  
  campoFim.addEventListener("change", atualizarTempo);
  atualizarTempo();
  
  // Atualiza a cada minuto
  setInterval(atualizarTempo, 60000);
}

// Botão para adicionar ingresso
addIngressoBtn.addEventListener("click", () => {
  const agora = new Date();
  const fimPadrao = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias
  
  adicionarIngresso(
    "Ingresso Geral", 
    "", 
    "",
    formatarDataLocal(agora),
    formatarDataLocal(fimPadrao)
  );
  
  setTimeout(() => {
    const ultimoIngresso = listaIngressos.lastElementChild;
    if (ultimoIngresso) {
      ultimoIngresso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
});

function mostrarMensagem(texto, tipo = "success") {
  mensagemEl.textContent = texto;
  mensagemEl.className = `mensagem ${tipo}`;
  mensagemEl.style.display = "block";
  
  setTimeout(() => {
    mensagemEl.style.display = "none";
  }, 5000);
}

/**
 * Valida formulário incluindo datas
 */
function validarFormulario() {
  const ingressos = [];
  const ingressosItems = listaIngressos.querySelectorAll(".ingresso-item");
  
  if (ingressosItems.length === 0) {
    throw new Error("Adicione pelo menos um tipo de ingresso.");
  }
  
  ingressosItems.forEach((div, index) => {
    const nome = div.querySelector(".ingresso-nome").value.trim();
    const preco = parseFloat(div.querySelector(".ingresso-preco").value);
    const quantidade = parseInt(div.querySelector(".ingresso-quantidade").value, 10);
    const dataInicio = new Date(div.querySelector(".ingresso-data-inicio").value);
    const dataFim = new Date(div.querySelector(".ingresso-data-fim").value);
    
    if (!nome) {
      throw new Error(`O nome do ingresso ${index + 1} é obrigatório.`);
    }
    
    if (isNaN(preco) || preco < 0) {
      throw new Error(`O preço do ingresso "${nome}" deve ser um valor válido.`);
    }
    
    if (isNaN(quantidade) || quantidade < 1) {
      throw new Error(`A quantidade do ingresso "${nome}" deve ser pelo menos 1.`);
    }

    if (isNaN(dataInicio.getTime())) {
      throw new Error(`Data de início do ingresso "${nome}" é inválida.`);
    }

    if (isNaN(dataFim.getTime())) {
      throw new Error(`Data de fim do ingresso "${nome}" é inválida.`);
    }

    if (dataInicio >= dataFim) {
      throw new Error(`A data de início deve ser anterior à data de fim para "${nome}".`);
    }
    
    ingressos.push({ 
      nome, 
      preco, 
      quantidade,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString()
    });
  });
  
  return ingressos;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "Usuario", user.uid));
    
    if (userDoc.exists()) {
      const dados = userDoc.data();
      document.querySelector(".user-name").textContent = dados.nome || "Usuário";
      document.getElementById("nomeUsuario").value = dados.nome || "";
      document.getElementById("cpfUsuario").value = dados.cpf || "";
      document.getElementById("telefoneUsuario").value = dados.telefone || "";
      document.getElementById("dataNascimentoUsuario").value = dados.dataNascimento || "";
    }
  } catch (e) {
    console.error("Erro ao buscar dados do usuário:", e);
    mostrarMensagem("Erro ao carregar dados do usuário.", "error");
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      mensagemEl.style.display = "none";
      btnCriarEvento.disabled = true;
      loader.style.display = "block";
      
      try {
        const ingressos = validarFormulario();
        
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
        
        if (!eventoData.nome) throw new Error("O nome do evento é obrigatório.");
        if (!eventoData.data) throw new Error("A data do evento é obrigatória.");
        if (!eventoData.tipo) throw new Error("Selecione uma categoria para o evento.");
        
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
        
        mostrarMensagem("✅ Evento criado com sucesso! Redirecionando...", "success");
        
        form.reset();
        listaIngressos.innerHTML = "";
        contadorIngressos = 0;
        
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

window.addEventListener("load", () => {
  if (listaIngressos.children.length === 0) {
    const agora = new Date();
    const fimPadrao = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    adicionarIngresso(
      "Ingresso Geral", 
      "", 
      "",
      formatarDataLocal(agora),
      formatarDataLocal(fimPadrao)
    );
  }
});

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