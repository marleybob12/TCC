/**
 * Limpa os campos do formulário relacionados ao CEP.
 */
function limpa_formulário_cep() {
    // Limpa valores do formulário de cep.
    document.getElementById('rua').value = "";
    document.getElementById('bairro').value = "";
    document.getElementById('cidade').value = "";
    document.getElementById('uf').value = "";
}

/**
 * Atualiza os campos do formulário com os dados do endereço.
 * @param {object} conteudo - Dados retornados pela API
 */
function atualizarCamposEndereco(conteudo) {
    document.getElementById('rua').value = conteudo.logradouro || "";
    document.getElementById('bairro').value = conteudo.bairro || "";
    document.getElementById('cidade').value = conteudo.localidade || "";
    document.getElementById('uf').value = conteudo.uf || "";
}

/**
 * Realiza a pesquisa do CEP informado.
 * Valida o formato do CEP e consulta a API ViaCEP.
 * @param {string} valor - CEP informado pelo usuário
 */
async function pesquisacep(valor) {
    // Nova variável "cep" somente com dígitos.
    const cep = valor.replace(/\D/g, '');

    // Verifica se campo cep possui valor informado.
    if (cep !== "") {
        // Expressão regular para validar o CEP.
        const validacep = /^[0-9]{8}$/;

        // Valida o formato do CEP.
        if (validacep.test(cep)) {
            // Preenche os campos com "..." enquanto consulta webservice.
            document.getElementById('rua').value = "...";
            document.getElementById('bairro').value = "...";
            document.getElementById('cidade').value = "...";
            document.getElementById('uf').value = "...";

            try {
                // Faz a requisição à API ViaCEP usando fetch.
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const conteudo = await response.json();

                if (!conteudo.erro) {
                    atualizarCamposEndereco(conteudo);
                } else {
                    limpa_formulário_cep();
                    alert("CEP não encontrado.");
                }
            } catch (error) {
                limpa_formulário_cep();
                console.error("Erro ao consultar o CEP:", error);
                alert("Erro ao consultar o CEP. Tente novamente mais tarde.");
            }
        } else {
            // cep é inválido.
            limpa_formulário_cep();
            alert("Formato de CEP inválido.");
        }
    } else {
        // cep sem valor, limpa formulário.
        limpa_formulário_cep();
    }
}
