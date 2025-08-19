import { db } from "./firebaseConfig.js";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

async function inserirDados() {
  try {
    // ID fictício para usuário de teste (padrão igual ao cadastro real)
    const usuarioID = "uid_teste_joao";

    // Criar usuário (NÃO salve a senha!)
    await setDoc(doc(db, "Usuario", usuarioID), {
      nome: "João Silva",
      email: "joao@email.com",
      dataNascimento: "2000-05-10",
      telefone: "11999999999",
      cpf: "12345678901",
      cnpjOrganizador: "12345678000199"
    });

    // Criar categorias
    const categoriaRef1 = await addDoc(collection(db, "Categoria"), {
      nome: "Tecnologia",
      descricao: "Eventos voltados para inovação tecnológica"
    });
    const categoriaRef2 = await addDoc(collection(db, "Categoria"), {
      nome: "Eventos sociais",
      descricao: "Os eventos sociais têm como objetivo a comemoração de algum momento marcante. Por isso, eles não possuem caráter comercial nem buscam obter lucros: aqui, a intenção é reunir família, amigos, colegas de trabalho e pessoas importantes na sua vida para festejar alguns exemplos são casamentos, aniversários, happy hours, churrascos"
    });

    // Criar local
    const localRef = await addDoc(collection(db, "Local"), {
      nome: "Centro de Convenções",
      logradouro: "Rua Exemplo",
      numero: "100",
      cidade: "São Paulo",
      bairro: "Centro",
      cep: "01000-000"
    });

    // Criar evento (usando categoriaRef1)
    const eventoRef = await addDoc(collection(db, "Evento"), {
      titulo: "Feira de Startups",
      descricao: "Evento para empreendedores apresentarem seus projetos",
      dataInicio: new Date("2025-08-10T09:00:00").toISOString(),
      dataFim: new Date("2025-08-10T18:00:00").toISOString(),
      dataCriacao: new Date().toISOString(),
      imagemBanner: "https://exemplo.com/banner.jpg",
      usuarioID: usuarioID, // Relacionamento pelo mesmo ID do usuário
      categoriaID: categoriaRef1.id,
      localID: localRef.id
    });

    // Criar inscrição
    const inscricaoRef = await addDoc(collection(db, "Inscricao"), {
      status: "Confirmada",
      usuarioID: usuarioID,
      eventoID: eventoRef.id
    });

    // Criar ingresso
    await addDoc(collection(db, "Ingresso"), {
      valor: 100.00,
      formaPagamento: "Cartão de Crédito",
      status: "Pago",
      dataPagamento: new Date().toISOString(),
      idInscricao: inscricaoRef.id
    });

    console.log("Todos os dados foram inseridos!");
  } catch (error) {
    console.error("Erro ao inserir dados de teste:", error);
  }
}

async function inserirDadosSympla() {
  try {
    // 1. Criar usuário e organizador
    const usuarioID = "uid_teste_joao";
    await setDoc(doc(db, "Usuario", usuarioID), {
      nome: "João Silva",
      email: "joao@email.com",
      tipo: "participante"
    });

    const organizadorRef = await addDoc(collection(db, "Organizador"), {
      usuarioID: usuarioID,
      nomeOrganizacao: "Eventos Tech LTDA",
      cnpj: "12345678000199"
    });

    // 2. Criar categoria
    const categoriaRef = await addDoc(collection(db, "Categoria"), {
      nome: "Tecnologia",
      descricao: "Eventos de tecnologia e inovação"
    });

    // 3. Criar local
    const localRef = await addDoc(collection(db, "Local"), {
      nome: "Centro de Convenções",
      endereco: "Rua Exemplo, 100, Centro, São Paulo, SP",
      cep: "01000-000"
    });

    // 4. Criar evento
    const eventoRef = await addDoc(collection(db, "Evento"), {
      titulo: "Feira de Startups",
      descricao: "Evento para empreendedores apresentarem seus projetos",
      dataInicio: new Date("2025-08-10T09:00:00").toISOString(),
      dataFim: new Date("2025-08-10T18:00:00").toISOString(),
      imagemBanner: "https://exemplo.com/banner.jpg",
      organizadorID: organizadorRef.id,
      categoriaID: categoriaRef.id,
      localID: localRef.id,
      status: "ativo"
    });

    // 5. Criar lote de ingressos
    const loteRef = await addDoc(collection(db, "Lote"), {
      eventoID: eventoRef.id,
      nome: "Lote Promocional",
      preco: 80.00,
      quantidade: 100,
      dataInicio: new Date("2025-07-01T00:00:00").toISOString(),
      dataFim: new Date("2025-08-01T23:59:59").toISOString()
    });

    // 6. Criar inscrição
    const inscricaoRef = await addDoc(collection(db, "Inscricao"), {
      usuarioID: usuarioID,
      eventoID: eventoRef.id,
      status: "confirmada",
      dataInscricao: new Date().toISOString()
    });

    // 7. Criar ingresso
    await addDoc(collection(db, "Ingresso"), {
      inscricaoID: inscricaoRef.id,
      loteID: loteRef.id,
      usuarioID: usuarioID,
      eventoID: eventoRef.id,
      valorPago: 80.00,
      formaPagamento: "Cartão de Crédito",
      status: "pago",
      dataPagamento: new Date().toISOString()
    });

    console.log("Dados inseridos seguindo a lógica do Sympla!");
  } catch (error) {
    console.error("Erro ao inserir dados Sympla-like:", error);
  }
}

// Chame apenas a função Sympla
inserirDadosSympla();
