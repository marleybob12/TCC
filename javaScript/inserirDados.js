import { db } from "./firebaseConfig.js";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

async function inserirDados() {
  try {
    // Usuários de teste (simulando o padrão do cadastro real)
    const usuarios = [
      {
        usuarioID: "uid_teste_joao",
        nome: "João Silva",
        email: "joao@email.com",
        telefone: "11999999999",
        cpf: "12345678901",
        dataNascimento: "2000-05-10",
        dataCriacao: new Date().toISOString()
      },
      {
        usuarioID: "uid_teste_maria",
        nome: "Maria Souza",
        email: "maria@email.com",
        telefone: "11988888888",
        cpf: "98765432100",
        dataNascimento: "1998-12-20",
        dataCriacao: new Date().toISOString()
      }
    ];

    for (const user of usuarios) {
      await setDoc(doc(db, "Usuario", user.usuarioID), user);
    }

    // Categorias
    const categoriaRef1 = await addDoc(collection(db, "Categoria"), {
      nome: "Tecnologia",
      descricao: "Eventos voltados para inovação tecnológica"
    });
    const categoriaRef2 = await addDoc(collection(db, "Categoria"), {
      nome: "Eventos Sociais",
      descricao: "Eventos para comemorações e confraternizações"
    });

    // Locais
    const localRef1 = await addDoc(collection(db, "Local"), {
      nome: "Centro de Convenções",
      logradouro: "Rua Exemplo",
      numero: "100",
      cidade: "São Paulo",
      bairro: "Centro",
      cep: "01000-000"
    });
    const localRef2 = await addDoc(collection(db, "Local"), {
      nome: "Espaço Gourmet",
      logradouro: "Av. Principal",
      numero: "200",
      cidade: "Rio de Janeiro",
      bairro: "Copacabana",
      cep: "22000-000"
    });

    // Eventos
    const eventoRef1 = await addDoc(collection(db, "Evento"), {
      titulo: "Feira de Startups",
      descricao: "Evento para empreendedores apresentarem seus projetos",
      dataInicio: new Date("2025-08-10T09:00:00").toISOString(),
      dataFim: new Date("2025-08-10T18:00:00").toISOString(),
      dataCriacao: new Date().toISOString(),
      imagemBanner: "https://exemplo.com/banner.jpg",
      usuarioID: "uid_teste_joao",
      categoriaID: categoriaRef1.id,
      localID: localRef1.id
    });

    const eventoRef2 = await addDoc(collection(db, "Evento"), {
      titulo: "Festa de Confraternização",
      descricao: "Celebração anual da empresa",
      dataInicio: new Date("2025-12-15T20:00:00").toISOString(),
      dataFim: new Date("2025-12-16T02:00:00").toISOString(),
      dataCriacao: new Date().toISOString(),
      imagemBanner: "https://exemplo.com/banner2.jpg",
      usuarioID: "uid_teste_maria",
      categoriaID: categoriaRef2.id,
      localID: localRef2.id
    });

    // Inscrições
    const inscricaoRef1 = await addDoc(collection(db, "Inscricao"), {
      status: "Confirmada",
      usuarioID: "uid_teste_joao",
      eventoID: eventoRef1.id
    });

    const inscricaoRef2 = await addDoc(collection(db, "Inscricao"), {
      status: "Confirmada",
      usuarioID: "uid_teste_maria",
      eventoID: eventoRef2.id
    });

    // Ingressos
    await addDoc(collection(db, "Ingresso"), {
      valor: 100.00,
      formaPagamento: "Cartão de Crédito",
      status: "Pago",
      dataPagamento: new Date().toISOString(),
      idInscricao: inscricaoRef1.id
    });

    await addDoc(collection(db, "Ingresso"), {
      valor: 80.00,
      formaPagamento: "Pix",
      status: "Pago",
      dataPagamento: new Date().toISOString(),
      idInscricao: inscricaoRef2.id
    });

    console.log("Todos os dados foram inseridos!");
  } catch (error) {
    console.error("Erro ao inserir dados de teste:", error);
  }
}

inserirDados();
