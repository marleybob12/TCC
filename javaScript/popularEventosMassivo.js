// Importa a função para inserir dados no Firestore
import { inserirDadosComOrganizador } from "./inserirDados.js";

/**
 * Popula o Firestore com eventos de teste para desenvolvimento.
 * @param {object} db - Instância do Firestore
 */
export async function popularEventosMassivo(db) {
  const usuarioTesteID = "aDesRZfPzSQ3qqZsodMRQMAydFV2"; // UID fixo para o organizador de teste

  // lista de eventos de teste cobrindo todas as categorias
  const eventos = [
    {
      nome: "Festival de Rock",
      descricao: "Grandes bandas nacionais em uma noite inesquecível.",
      tipo: "Musica",
      endereco: "Arena Principal",
      cep: "01001-100",
      data: "2025-09-25",
      hora: "19:00",
      bannerUrl: "../img/festival_rock.jpg",
      ingressos: [
        { nome: "Pista", preco: "50", quantidade: "500" },
        { nome: "VIP", preco: "150", quantidade: "200" }
      ]
    },
    {
      nome: "Palestra Motivacional",
      descricao: "Uma noite de inspiração e superação.",
      tipo: "Palestra",
      endereco: "Auditório Central",
      cep: "02002-200",
      data: "2025-10-01",
      hora: "18:30",
      bannerUrl: "../img/palestra.jpg",
      ingressos: [{ nome: "Entrada Única", preco: "40", quantidade: "300" }]
    },
    {
      nome: "Seminário de Educação",
      descricao: "Debates sobre o futuro da educação.",
      tipo: "Seminario",
      endereco: "Universidade Estadual",
      cep: "03003-300",
      data: "2025-11-10",
      hora: "09:00",
      bannerUrl: "../img/seminario.jpg",
      ingressos: [{ nome: "Entrada Geral", preco: "60", quantidade: "200" }]
    },
    {
      nome: "Campeonato de Vôlei",
      descricao: "Times disputando a taça regional.",
      tipo: "Esportes",
      endereco: "Ginásio Municipal",
      cep: "04004-400",
      data: "2025-10-15",
      hora: "16:00",
      bannerUrl: "../img/volei.jpg",
      ingressos: [{ nome: "Arquibancada", preco: "20", quantidade: "600" }]
    },
    {
      nome: "Peça Teatral Clássica",
      descricao: "Uma releitura moderna de Shakespeare.",
      tipo: "Teatro_e_Espetaculos",
      endereco: "Teatro Municipal",
      cep: "05005-500",
      data: "2025-10-30",
      hora: "20:00",
      bannerUrl: "../img/teatro.jpg",
      ingressos: [{ nome: "Plateia", preco: "70", quantidade: "250" }]
    },
    {
      nome: "Congresso de Tecnologia",
      descricao: "Discussões sobre IA e inovação digital.",
      tipo: "Tecnologia",
      endereco: "Expo Center Norte",
      cep: "06006-600",
      data: "2025-11-05",
      hora: "10:00",
      bannerUrl: "../img/congresso.jpg",
      ingressos: [
        { nome: "Normal", preco: "200", quantidade: "500" },
        { nome: "Premium", preco: "400", quantidade: "100" }
      ]
    },
    {
      nome: "Exposição de Arte Moderna",
      descricao: "Obras inéditas de artistas nacionais.",
      tipo: "Artes",
      endereco: "Museu Nacional",
      cep: "07007-700",
      data: "2025-09-29",
      hora: "14:00",
      bannerUrl: "../img/arte.jpg",
      ingressos: [{ nome: "Ingresso Único", preco: "30", quantidade: "200" }]
    },
    {
      nome: "Festival Gastronômico Italiano",
      descricao: "Massas, pizzas e vinhos em destaque.",
      tipo: "Gastronomia",
      endereco: "Centro Gastronômico",
      cep: "08008-800",
      data: "2025-12-01",
      hora: "12:00",
      bannerUrl: "../img/gastronomia.jpg",
      ingressos: [{ nome: "Entrada", preco: "25", quantidade: "1000" }]
    },
    {
      nome: "Feira de Negócios",
      descricao: "Networking e oportunidades de parcerias.",
      tipo: "Negocios",
      endereco: "Centro de Eventos",
      cep: "09009-900",
      data: "2025-11-15",
      hora: "08:00",
      bannerUrl: "../img/negocios.jpg",
      ingressos: [{ nome: "Passaporte", preco: "150", quantidade: "300" }]
    },
    {
      nome: "Congresso Educacional",
      descricao: "Professores e alunos debatendo inovação.",
      tipo: "Educacao",
      endereco: "Universidade Federal",
      cep: "10010-000",
      data: "2025-11-20",
      hora: "09:00",
      bannerUrl: "../img/educacao.jpg",
      ingressos: [{ nome: "Entrada", preco: "50", quantidade: "400" }]
    },
    {
      nome: "Feira de Saúde",
      descricao: "Exames gratuitos e palestras médicas.",
      tipo: "Saude",
      endereco: "Praça da Saúde",
      cep: "11011-000",
      data: "2025-09-30",
      hora: "08:00",
      bannerUrl: "../img/saude.jpg",
      ingressos: [{ nome: "Entrada", preco: "0", quantidade: "1000" }]
    },
    {
      nome: "Desfile de Moda",
      descricao: "Tendências da próxima estação.",
      tipo: "Moda",
      endereco: "Shopping Fashion Hall",
      cep: "12012-000",
      data: "2025-10-22",
      hora: "19:30",
      bannerUrl: "../img/moda.jpg",
      ingressos: [{ nome: "Entrada", preco: "120", quantidade: "300" }]
    },
    {
      nome: "Show de Sertanejo",
      descricao: "Dupla famosa em apresentação especial.",
      tipo: "Festas_e_Shows",
      endereco: "Arena Country",
      cep: "13013-000",
      data: "2025-12-10",
      hora: "22:00",
      bannerUrl: "../img/sertanejo.jpg",
      ingressos: [{ nome: "Pista", preco: "70", quantidade: "800" }]
    },
    {
      nome: "Stand Up Comedy Night",
      descricao: "Humoristas de todo o Brasil no mesmo palco.",
      tipo: "Stand_up_Comedy",
      endereco: "Comedy Club",
      cep: "14014-000",
      data: "2025-09-26",
      hora: "21:00",
      bannerUrl: "../img/comedy.jpg",
      ingressos: [{ nome: "Entrada", preco: "50", quantidade: "200" }]
    },
    {
      nome: "Show Infantil",
      descricao: "Espetáculo mágico para crianças.",
      tipo: "Infantil",
      endereco: "Teatro Kids",
      cep: "15015-000",
      data: "2025-11-12",
      hora: "15:00",
      bannerUrl: "../img/infantil.jpg",
      ingressos: [{ nome: "Entrada", preco: "30", quantidade: "500" }]
    },
    {
      nome: "Passeio de Trem Turístico",
      descricao: "Uma viagem divertida para toda a família.",
      tipo: "Passeios_para_toda_familia",
      endereco: "Estação Central",
      cep: "16016-000",
      data: "2025-12-05",
      hora: "09:00",
      bannerUrl: "../img/trem.jpg",
      ingressos: [{ nome: "Ingresso", preco: "60", quantidade: "300" }]
    },
    {
      nome: "Festa Junina Tradicional",
      descricao: "Comidas típicas, quadrilha e fogueira.",
      tipo: "Festas_Tipicas",
      endereco: "Praça Central",
      cep: "17017-000",
      data: "2025-06-24",
      hora: "18:00",
      bannerUrl: "../img/festa_junina.jpg",
      ingressos: [{ nome: "Entrada", preco: "10", quantidade: "1000" }]
    },
    {
      nome: "Convenção de Quadrinhos",
      descricao: "Exposição de HQs e cosplay.",
      tipo: "Convencoes",
      endereco: "Centro de Convenções",
      cep: "18018-000",
      data: "2025-08-20",
      hora: "10:00",
      bannerUrl: "../img/convecoes.jpg",
      ingressos: [{ nome: "Passaporte", preco: "100", quantidade: "400" }]
    },
    {
      nome: "Campeonato de E-Sports",
      descricao: "Disputa entre os melhores gamers.",
      tipo: "Games",
      endereco: "Arena Gamer",
      cep: "19019-000",
      data: "2025-09-18",
      hora: "13:00",
      bannerUrl: "../img/games.jpg",
      ingressos: [{ nome: "Ingresso", preco: "40", quantidade: "500" }]
    },
    {
      nome: "Maratona Fitness",
      descricao: "Corrida e atividades de condicionamento físico.",
      tipo: "Fitness",
      endereco: "Parque Municipal",
      cep: "20020-000",
      data: "2025-10-02",
      hora: "07:00",
      bannerUrl: "../img/fitness.jpg",
      ingressos: [{ nome: "Inscrição", preco: "80", quantidade: "1000" }]
    },
    {
      nome: "Encontro Social Beneficente",
      descricao: "Evento para arrecadação de fundos solidários.",
      tipo: "Encontros_Sociais",
      endereco: "Salão de Festas",
      cep: "21021-000",
      data: "2025-12-15",
      hora: "20:00",
      bannerUrl: "../img/social.jpg",
      ingressos: [{ nome: "Convite", preco: "60", quantidade: "200" }]
    },
    {
      nome: "Café com Networking",
      descricao: "Profissionais trocando ideias e contatos.",
      tipo: "Cafes_e_Network",
      endereco: "Café Central",
      cep: "22022-000",
      data: "2025-09-19",
      hora: "08:00",
      bannerUrl: "../img/cafe.jpg",
      ingressos: [{ nome: "Ingresso", preco: "20", quantidade: "100" }]
    },
    {
      nome: "Workshop de Fotografia",
      descricao: "Aprenda técnicas avançadas de fotografia.",
      tipo: "Workshops",
      endereco: "Estúdio Criativo",
      cep: "23023-000",
      data: "2025-10-07",
      hora: "14:00",
      bannerUrl: "../img/workshop.jpg",
      ingressos: [{ nome: "Inscrição", preco: "90", quantidade: "150" }]
    },
    {
      nome: "Festival de Cultura Popular",
      descricao: "Dança, música e arte em um grande festival.",
      tipo: "Festivais",
      endereco: "Parque das Nações",
      cep: "24024-000",
      data: "2025-11-25",
      hora: "10:00",
      bannerUrl: "../img/festival.jpg",
      ingressos: [{ nome: "Entrada", preco: "30", quantidade: "600" }]
    },
    {
      nome: "Evento Especial",
      descricao: "Categoria diversa para testes.",
      tipo: "Outros",
      endereco: "Espaço Livre",
      cep: "25025-000",
      data: "2025-12-31",
      hora: "23:59",
      bannerUrl: "../img/outros.jpg",
      ingressos: [{ nome: "Entrada", preco: "0", quantidade: "100" }]
    }
  ];

  try {
    for (const evento of eventos) {
      await inserirDadosComOrganizador(
        db,
        usuarioTesteID,
        "Organizador Teste",
        "organizador@teste.com",
        "11988887777",
        "000.000.000-00",
        "1990-01-01",
        evento
      );

      // Criar Evento
      const dataEvento = new Date(`${evento.data}T${evento.hora}`);
      const eventoRef = await addDoc(collection(db, "Evento"), {
        titulo: evento.nome,
        descricao: evento.descricao,
        dataInicio: dataEvento,
        dataFim: dataEvento,
        imagemBanner: evento.bannerUrl || "",
        organizadorID: usuarioTesteID, // usa o UID do usuário atual
        categoriaID: categoriaRef.id, // Associar o evento à categoria correta
        localID: localRef.id,
        status: "ativo",
        dataCriacao: serverTimestamp()
      });
      console.log("✅ Evento criado com sucesso.");
    }

    console.log("✅ Base de teste com vários eventos criada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular eventos massivos:", error.message);
  }
}
