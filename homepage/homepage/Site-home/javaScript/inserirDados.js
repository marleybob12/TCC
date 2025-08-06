import { db } from "./firebaseConfig.js";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

async function inserirDados() {
  // Criar usuário
  await setDoc(doc(db, "Usuario", "12345678901"), {
    nome: "João Silva",
    email: "joao@email.com",
    senha: "123456",
    dataNascimento: "2000-05-10",
    telefone: "11999999999",
    cnpjOrganizador: "12345678000199"
  });

  // Criar categoria
  const categoriaRef = await addDoc(collection(db, "Categoria"), {
    nome: "Tecnologia",
    descricao: "Eventos voltados para inovação tecnológica"
  });
  categoriaRef = await addDoc(collection(db, "Categoria"),{
    nome : "Eventos sociais",
    descricao: "Os eventos sociais têm como objetivo a comemoração de algum momento marcante. Por isso, eles não possuem caráter comercial nem buscam obter lucros: aqui, a intenção é reunir família, amigos, colegas de trabalho e pessoas importantes na sua vida para festejar alguns exemplos são casamentos,aniversários,happy hours,churrascos"  });

  // Criar local
  const localRef = await addDoc(collection(db, "Local"), {
    nome: "Centro de Convenções",
    logradouro: "Rua Exemplo",
    numero: "100",
    cidade: "São Paulo",
    bairro: "Centro",
    cep: "01000-000"
  });

  // Criar evento
  const eventoRef = await addDoc(collection(db, "Evento"), {
    titulo: "Feira de Startups",
    descricao: "Evento para empreendedores apresentarem seus projetos",
    dataInicio: new Date("2025-08-10T09:00:00"),
    dataFim: new Date("2025-08-10T18:00:00"),
    dataCriacao: new Date(),
    imagemBanner: "https://exemplo.com/banner.jpg",
    usuarioCPF: "12345678901",
    categoriaID: categoriaRef.id,
    localID: localRef.id
  });

  // Criar inscrição
  const inscricaoRef = await addDoc(collection(db, "Inscricao"), {
    status: "Confirmada",
    usuarioCPF: "12345678901",
    eventoID: eventoRef.id
  });

  // Criar ingresso
  await addDoc(collection(db, "Ingressos"), {
    valor: 100.00,
    formaPagamento: "Cartão de Crédito",
    status: "Pago",
    dataPagamento: new Date(),
    idInscricao: inscricaoRef.id
  });

  console.log("Todos os dados foram inseridos!");
}

// Chamar a função
inserirDados();
