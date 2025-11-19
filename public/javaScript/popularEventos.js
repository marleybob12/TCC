// popularEventos.js
import { db } from "./firebaseConfig.js";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Script para popular o EventFlow com 50+ eventos variados
 * Execute este arquivo uma única vez para criar os eventos de exemplo
 */

// Dados dos eventos
const eventosData = [
  // MÚSICA
  {
    titulo: "Festival Rock in Rio 2025",
    descricao: "O maior festival de rock do Brasil com bandas internacionais e nacionais.",
    categoria: "Musica",
    local: "São Paulo",
    endereco: "Parque Olímpico, Av. Paulista, 1000",
    cep: "01310-100",
    dataInicio: new Date("2025-12-15T18:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    ingressos: [
      { nome: "Pista", preco: 450, quantidade: 5000 },
      { nome: "Camarote", preco: 1200, quantidade: 500 }
    ]
  },
  {
    titulo: "Sertanejo Universitário - Ao Vivo",
    descricao: "Grandes nomes do sertanejo em um show único.",
    categoria: "Musica",
    local: "Belo Horizonte",
    endereco: "Mineirinho, Av. Antônio Carlos, 6627",
    cep: "31270-901",
    dataInicio: new Date("2025-11-25T20:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
    ingressos: [
      { nome: "Pista", preco: 120, quantidade: 3000 },
      { nome: "VIP", preco: 300, quantidade: 300 }
    ]
  },
  {
    titulo: "Noite do Jazz",
    descricao: "Uma noite especial com os melhores músicos de jazz do país.",
    categoria: "Musica",
    local: "Rio de Janeiro",
    endereco: "Teatro Municipal, Praça Floriano",
    cep: "20031-050",
    dataInicio: new Date("2025-12-01T19:30:00"),
    imagemBanner: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800",
    ingressos: [
      { nome: "Plateia", preco: 80, quantidade: 400 },
      { nome: "Balcão", preco: 50, quantidade: 200 }
    ]
  },
  {
    titulo: "Festival de Música Eletrônica",
    descricao: "Os melhores DJs internacionais em uma noite inesquecível.",
    categoria: "Musica",
    local: "São Paulo",
    endereco: "Allianz Parque, Rua Palestra Itália, 1100",
    cep: "01234-567",
    dataInicio: new Date("2025-12-20T22:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1571266028243-d220c6e2e8cc?w=800",
    ingressos: [
      { nome: "Pista", preco: 200, quantidade: 8000 },
      { nome: "Open Bar", preco: 500, quantidade: 1000 }
    ]
  },

  // PALESTRAS
  {
    titulo: "TEDx São Paulo 2025",
    descricao: "Ideias que valem a pena espalhar com palestrantes inspiradores.",
    categoria: "Palestra",
    local: "São Paulo",
    endereco: "Teatro Renault, Av. Brigadeiro Luís Antônio, 411",
    cep: "01317-901",
    dataInicio: new Date("2025-11-30T14:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    ingressos: [
      { nome: "Geral", preco: 150, quantidade: 800 }
    ]
  },
  {
    titulo: "Palestra: O Futuro da Inteligência Artificial",
    descricao: "Especialistas discutem os rumos da IA nos próximos anos.",
    categoria: "Palestra",
    local: "São Paulo",
    endereco: "Faria Lima Convention Center, Av. Faria Lima, 2000",
    cep: "01452-000",
    dataInicio: new Date("2025-12-05T09:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
    ingressos: [
      { nome: "Individual", preco: 80, quantidade: 500 },
      { nome: "Empresarial", preco: 300, quantidade: 100 }
    ]
  },

  // SEMINÁRIOS
  {
    titulo: "Seminário de Marketing Digital 2025",
    descricao: "As melhores estratégias de marketing para o próximo ano.",
    categoria: "Seminario",
    local: "Rio de Janeiro",
    endereco: "Centro de Convenções, Av. Atlântica, 1800",
    cep: "22021-001",
    dataInicio: new Date("2025-11-28T08:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
    ingressos: [
      { nome: "Day Pass", preco: 200, quantidade: 300 },
      { nome: "Full Access", preco: 500, quantidade: 100 }
    ]
  },

  // ESPORTES
  {
    titulo: "Corrida Noturna SP",
    descricao: "5km e 10km pelas principais avenidas de São Paulo.",
    categoria: "Esportes",
    local: "São Paulo",
    endereco: "Parque Ibirapuera, Av. Pedro Álvares Cabral",
    cep: "04094-050",
    dataInicio: new Date("2025-12-10T19:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
    ingressos: [
      { nome: "5km", preco: 60, quantidade: 1000 },
      { nome: "10km", preco: 80, quantidade: 800 }
    ]
  },
  {
    titulo: "Campeonato de Beach Volleyball",
    descricao: "Torneio de vôlei de praia com times de todo o Brasil.",
    categoria: "Esportes",
    local: "Rio de Janeiro",
    endereco: "Praia de Copacabana, Av. Atlântica",
    cep: "22070-001",
    dataInicio: new Date("2025-12-08T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800",
    ingressos: [
      { nome: "Geral", preco: 30, quantidade: 2000 }
    ]
  },

  // TEATRO E ESPETÁCULOS
  {
    titulo: "O Fantasma da Ópera",
    descricao: "O clássico musical em cartaz pela primeira vez no Brasil.",
    categoria: "Teatro_e_Espetaculos",
    local: "São Paulo",
    endereco: "Teatro Renault, Av. Brigadeiro Luís Antônio, 411",
    cep: "01317-901",
    dataInicio: new Date("2025-12-12T20:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800",
    ingressos: [
      { nome: "Plateia", preco: 180, quantidade: 600 },
      { nome: "Balcão Nobre", preco: 280, quantidade: 200 }
    ]
  },
  {
    titulo: "Cirque du Soleil - VOLTA",
    descricao: "Espetáculo acrobático de tirar o fôlego.",
    categoria: "Teatro_e_Espetaculos",
    local: "Rio de Janeiro",
    endereco: "Barra da Tijuca, Av. das Américas, 5000",
    cep: "22640-102",
    dataInicio: new Date("2025-12-18T19:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1464047736614-af63643285bf?w=800",
    ingressos: [
      { nome: "Pista", preco: 300, quantidade: 1500 },
      { nome: "Premium", preco: 600, quantidade: 300 }
    ]
  },

  // TECNOLOGIA
  {
    titulo: "Hackathon Brasil Tech 2025",
    descricao: "48 horas programando para resolver desafios reais.",
    categoria: "Tecnologia",
    local: "São Paulo",
    endereco: "Google Campus, Rua Fidêncio Ramos, 195",
    cep: "04551-010",
    dataInicio: new Date("2025-12-02T09:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    ingressos: [
      { nome: "Individual", preco: 50, quantidade: 200 },
      { nome: "Time", preco: 150, quantidade: 50 }
    ]
  },
  {
    titulo: "Web Summit Brasil",
    descricao: "O maior evento de tecnologia e inovação da América Latina.",
    categoria: "Tecnologia",
    local: "São Paulo",
    endereco: "Expo Center Norte, Rua José Bernardo Pinto, 333",
    cep: "02055-000",
    dataInicio: new Date("2025-12-14T08:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    ingressos: [
      { nome: "Day Pass", preco: 400, quantidade: 5000 },
      { nome: "Full Access", preco: 1500, quantidade: 1000 }
    ]
  },

  // ARTES
  {
    titulo: "Exposição Frida Kahlo",
    descricao: "Obras inéditas da artista mexicana em exposição.",
    categoria: "Artes",
    local: "São Paulo",
    endereco: "MASP, Av. Paulista, 1578",
    cep: "01310-200",
    dataInicio: new Date("2025-11-20T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800",
    ingressos: [
      { nome: "Inteira", preco: 40, quantidade: 1000 },
      { nome: "Meia", preco: 20, quantidade: 1000 }
    ]
  },
  {
    titulo: "Festival de Arte Urbana",
    descricao: "Grafiteiros de todo o mundo transformam a cidade.",
    categoria: "Artes",
    local: "São Paulo",
    endereco: "Beco do Batman, Rua Medeiros de Albuquerque",
    cep: "05436-060",
    dataInicio: new Date("2025-12-03T12:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800",
    ingressos: [
      { nome: "Grátis", preco: 0, quantidade: 5000 }
    ]
  },

  // GASTRONOMIA
  {
    titulo: "Festival Gastronômico SP",
    descricao: "Os melhores chefs apresentam pratos exclusivos.",
    categoria: "Gastronomia",
    local: "São Paulo",
    endereco: "Parque Villa-Lobos, Av. Prof. Fonseca Rodrigues, 2001",
    cep: "05317-020",
    dataInicio: new Date("2025-11-22T11:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    ingressos: [
      { nome: "Geral", preco: 80, quantidade: 3000 },
      { nome: "VIP Degustação", preco: 250, quantidade: 500 }
    ]
  },
  {
    titulo: "Wine Experience Brasil",
    descricao: "Degustação de vinhos de todo o mundo.",
    categoria: "Gastronomia",
    local: "Belo Horizonte",
    endereco: "Expominas, Av. Amazonas, 6000",
    cep: "30510-000",
    dataInicio: new Date("2025-12-07T18:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
    ingressos: [
      { nome: "Standard", preco: 120, quantidade: 800 },
      { nome: "Premium", preco: 300, quantidade: 200 }
    ]
  },

  // NEGÓCIOS
  {
    titulo: "Congresso de Empreendedorismo",
    descricao: "Cases de sucesso e networking para empreendedores.",
    categoria: "Negocios",
    local: "São Paulo",
    endereco: "WTC, Av. das Nações Unidas, 12551",
    cep: "04578-903",
    dataInicio: new Date("2025-11-26T08:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    ingressos: [
      { nome: "Individual", preco: 350, quantidade: 1000 },
      { nome: "Empresarial", preco: 1200, quantidade: 100 }
    ]
  },

  // EDUCAÇÃO
  {
    titulo: "Semana Nacional da Educação",
    descricao: "Workshops e palestras sobre o futuro da educação.",
    categoria: "Educacao",
    local: "Brasília",
    endereco: "Universidade de Brasília, Campus Darcy Ribeiro",
    cep: "70910-900",
    dataInicio: new Date("2025-11-29T09:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    ingressos: [
      { nome: "Estudante", preco: 30, quantidade: 2000 },
      { nome: "Professor", preco: 50, quantidade: 500 }
    ]
  },

  // SAÚDE
  {
    titulo: "Corrida Rosa - Outubro Rosa",
    descricao: "Corrida beneficente em apoio à prevenção do câncer de mama.",
    categoria: "Saude",
    local: "Rio de Janeiro",
    endereco: "Aterro do Flamengo, Av. Infante Dom Henrique",
    cep: "20021-140",
    dataInicio: new Date("2025-11-21T07:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    ingressos: [
      { nome: "5km", preco: 40, quantidade: 3000 },
      { nome: "10km", preco: 60, quantidade: 2000 }
    ]
  },

  // MODA
  {
    titulo: "São Paulo Fashion Week",
    descricao: "A maior semana de moda da América Latina.",
    categoria: "Moda",
    local: "São Paulo",
    endereco: "Arca, Rua Gomes de Carvalho, 842",
    cep: "04547-004",
    dataInicio: new Date("2025-12-11T19:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1558769132-cb1aea3c892e?w=800",
    ingressos: [
      { nome: "Geral", preco: 500, quantidade: 800 },
      { nome: "Front Row", preco: 2000, quantidade: 100 }
    ]
  },

  // FESTAS E SHOWS
  {
    titulo: "Réveillon Copacabana 2025",
    descricao: "A maior festa de ano novo do Brasil.",
    categoria: "Festas_e_Shows",
    local: "Rio de Janeiro",
    endereco: "Praia de Copacabana, Av. Atlântica",
    cep: "22070-001",
    dataInicio: new Date("2025-12-31T20:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800",
    ingressos: [
      { nome: "Área VIP", preco: 800, quantidade: 2000 },
      { nome: "Open Bar", preco: 1500, quantidade: 500 }
    ]
  },
  {
    titulo: "Carnaval Salvador 2025",
    descricao: "O maior carnaval de rua do mundo.",
    categoria: "Festas_e_Shows",
    local: "Salvador",
    endereco: "Circuito Dodô, Av. Oceanica",
    cep: "40140-130",
    dataInicio: new Date("2026-02-13T14:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    ingressos: [
      { nome: "Camarote", preco: 1200, quantidade: 3000 },
      { nome: "Abadá", preco: 400, quantidade: 10000 }
    ]
  },

  // STAND UP COMEDY
  {
    titulo: "Festival Comédia ao Vivo",
    descricao: "Os melhores comediantes do Brasil em uma noite hilária.",
    categoria: "Stand_up_Comedy",
    local: "São Paulo",
    endereco: "Teatro Bradesco, Bourbon Shopping, Rua Turiassu, 2100",
    cep: "05005-900",
    dataInicio: new Date("2025-12-06T21:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800",
    ingressos: [
      { nome: "Plateia", preco: 80, quantidade: 500 },
      { nome: "Mesa VIP", preco: 200, quantidade: 50 }
    ]
  },

  // INFANTIL
  {
    titulo: "Patrulha Canina - O Show",
    descricao: "Os heróis favoritos das crianças ao vivo.",
    categoria: "Infantil",
    local: "São Paulo",
    endereco: "Tom Brasil, Rua Bragança Paulista, 1281",
    cep: "04634-023",
    dataInicio: new Date("2025-11-24T15:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
    ingressos: [
      { nome: "Infantil", preco: 60, quantidade: 1000 },
      { nome: "Adulto", preco: 40, quantidade: 1000 }
    ]
  },
  {
    titulo: "Mundo Bita em Concerto",
    descricao: "Show musical educativo para toda a família.",
    categoria: "Infantil",
    local: "Belo Horizonte",
    endereco: "Teatro Sesiminas, Rua Padre Marinho, 60",
    cep: "30112-040",
    dataInicio: new Date("2025-12-13T16:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800",
    ingressos: [
      { nome: "Criança", preco: 50, quantidade: 800 },
      { nome: "Adulto", preco: 50, quantidade: 800 }
    ]
  },

  // FAMÍLIA
  {
    titulo: "Picnic no Parque",
    descricao: "Dia de diversão em família com atividades ao ar livre.",
    categoria: "Passeios_para_toda_familia",
    local: "São Paulo",
    endereco: "Parque do Povo, Av. Henrique Chamma",
    cep: "04709-000",
    dataInicio: new Date("2025-11-23T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    ingressos: [
      { nome: "Família (4 pessoas)", preco: 80, quantidade: 500 }
    ]
  },

  // FESTAS TÍPICAS
  {
    titulo: "Oktoberfest Blumenau 2025",
    descricao: "A maior festa alemã das Américas.",
    categoria: "Festas_Tipicas",
    local: "Blumenau",
    endereco: "Parque Vila Germânica, Rua Alberto Stein, 199",
    cep: "89056-500",
    dataInicio: new Date("2025-10-08T18:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800",
    ingressos: [
      { nome: "Ingresso Diário", preco: 70, quantidade: 5000 },
      { nome: "Passaporte 5 dias", preco: 250, quantidade: 2000 }
    ]
  },
  {
    titulo: "Festa Junina Gigante",
    descricao: "A maior festa junina de São Paulo.",
    categoria: "Festas_Tipicas",
    local: "São Paulo",
    endereco: "Parque do Ibirapuera, Av. Pedro Álvares Cabral",
    cep: "04094-050",
    dataInicio: new Date("2026-06-20T18:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    ingressos: [
      { nome: "Geral", preco: 20, quantidade: 10000 }
    ]
  },

  // CONVENÇÕES
  {
    titulo: "Comic Con Experience 2025",
    descricao: "O maior evento de cultura pop da América Latina.",
    categoria: "Convencoes",
    local: "São Paulo",
    endereco: "São Paulo Expo, Rodovia dos Imigrantes, 1,5 km",
    cep: "04329-100",
    dataInicio: new Date("2025-12-04T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=800",
    ingressos: [
      { nome: "1 Dia", preco: 200, quantidade: 10000 },
      { nome: "4 Dias", preco: 600, quantidade: 5000 },
      { nome: "Epic Pass", preco: 1500, quantidade: 500 }
    ]
  },
  {
    titulo: "Anime Friends 2025",
    descricao: "Convenção dedicada à cultura japonesa e animes.",
    categoria: "Convencoes",
    local: "São Paulo",
    endereco: "Expo Center Norte, Rua José Bernardo Pinto, 333",
    cep: "02055-000",
    dataInicio: new Date("2025-07-18T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=800",
    ingressos: [
      { nome: "Day Pass", preco: 100, quantidade: 8000 },
      { nome: "Weekend", preco: 280, quantidade: 3000 }
    ]
  },

  // GAMES
  {
    titulo: "Brasil Game Show 2025",
    descricao: "A maior feira de games da América Latina.",
    categoria: "Games",
    local: "São Paulo",
    endereco: "Expo Center Norte, Rua José Bernardo Pinto, 333",
    cep: "02055-000",
    dataInicio: new Date("2025-10-10T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800",
    ingressos: [
      { nome: "1 Dia", preco: 90, quantidade: 15000 },
      { nome: "4 Dias", preco: 280, quantidade: 5000 }
    ]
  },
  {
    titulo: "Campeonato E-Sports Brasil",
    descricao: "Torneio nacional de League of Legends e CS:GO.",
    categoria: "Games",
    local: "Rio de Janeiro",
    endereco: "Arena Carioca, Av. Embaixador Abelardo Bueno, 3401",
    cep: "22775-040",
    dataInicio: new Date("2025-11-27T14:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
    ingressos: [
      { nome: "Arquibancada", preco: 40, quantidade: 5000 },
      { nome: "Cadeira", preco: 80, quantidade: 2000 }
    ]
  },

  // FITNESS
  {
    titulo: "Maratona do Rio",
    descricao: "42km pelas mais belas paisagens do Rio de Janeiro.",
    categoria: "Fitness",
    local: "Rio de Janeiro",
    endereco: "Lagoa Rodrigo de Freitas",
    cep: "22470-000",
    dataInicio: new Date("2025-06-15T06:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800",
    ingressos: [
      { nome: "42km", preco: 150, quantidade: 5000 },
      { nome: "21km", preco: 100, quantidade: 3000 }
    ]
  },
  {
    titulo: "Yoga Festival Brasil",
    descricao: "Três dias de práticas, meditação e bem-estar.",
    categoria: "Fitness",
    local: "São Paulo",
    endereco: "Parque Villa-Lobos, Av. Prof. Fonseca Rodrigues, 2001",
    cep: "05317-020",
    dataInicio: new Date("2025-09-19T07:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    ingressos: [
      { nome: "Day Pass", preco: 80, quantidade: 2000 },
      { nome: "Weekend", preco: 200, quantidade: 800 }
    ]
  },

  // ENCONTROS SOCIAIS
  {
    titulo: "Speed Dating SP",
    descricao: "Encontre seu par em uma noite divertida.",
    categoria: "Encontros_Sociais",
    local: "São Paulo",
    endereco: "Bar dos Arcos, Av. Paulista, 2073",
    cep: "01311-940",
    dataInicio: new Date("2025-11-22T19:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    ingressos: [
      { nome: "Individual", preco: 60, quantidade: 100 }
    ]
  },

  // CAFÉS E NETWORKING
  {
    titulo: "Coffee & Code Meetup",
    descricao: "Networking para desenvolvedores e café especial.",
    categoria: "Cafes_e_Network",
    local: "São Paulo",
    endereco: "Starbucks Reserve, Al. Santos, 1437",
    cep: "01419-001",
    dataInicio: new Date("2025-11-25T08:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
    ingressos: [
      { nome: "Com café", preco: 30, quantidade: 50 }
    ]
  },
  {
    titulo: "Women in Tech Breakfast",
    descricao: "Café da manhã e networking para mulheres em tecnologia.",
    categoria: "Cafes_e_Network",
    local: "Belo Horizonte",
    endereco: "Google Campus BH, Av. Getúlio Vargas, 1300",
    cep: "30112-021",
    dataInicio: new Date("2025-12-09T08:30:00"),
    imagemBanner: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
    ingressos: [
      { nome: "Com breakfast", preco: 40, quantidade: 80 }
    ]
  },

  // WORKSHOPS
  {
    titulo: "Workshop de Fotografia",
    descricao: "Aprenda técnicas profissionais de fotografia.",
    categoria: "Workshops",
    local: "São Paulo",
    endereco: "Escola Panamericana de Arte, Rua Cel. Oscar Porto, 281",
    cep: "04003-000",
    dataInicio: new Date("2025-11-28T14:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800",
    ingressos: [
      { nome: "Individual", preco: 250, quantidade: 30 }
    ]
  },
  {
    titulo: "Workshop de Culinária Italiana",
    descricao: "Aprenda a fazer massas artesanais com chef italiano.",
    categoria: "Workshops",
    local: "São Paulo",
    endereco: "Centro Europeu, Rua Dr. Melo Alves, 81",
    cep: "01417-010",
    dataInicio: new Date("2025-12-16T15:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
    ingressos: [
      { nome: "Individual", preco: 180, quantidade: 25 }
    ]
  },
  {
    titulo: "Workshop de Design Thinking",
    descricao: "Metodologia ágil para inovação e resolução de problemas.",
    categoria: "Workshops",
    local: "Rio de Janeiro",
    endereco: "WeWork, Rua da Assembleia, 10",
    cep: "20011-000",
    dataInicio: new Date("2025-12-17T09:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800",
    ingressos: [
      { nome: "Individual", preco: 300, quantidade: 40 }
    ]
  },

  // FESTIVAIS
  {
    titulo: "Festival de Inverno de Campos do Jordão",
    descricao: "O maior festival de música clássica da América Latina.",
    categoria: "Festivais",
    local: "Campos do Jordão",
    endereco: "Auditório Claudio Santoro, Av. Dr. Luis Arrobas Martins, 1880",
    cep: "12460-000",
    dataInicio: new Date("2026-07-03T20:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    ingressos: [
      { nome: "Plateia", preco: 120, quantidade: 800 },
      { nome: "Balcão", preco: 80, quantidade: 400 }
    ]
  },
  {
    titulo: "Lollapalooza Brasil 2026",
    descricao: "Festival com os maiores artistas internacionais.",
    categoria: "Festivais",
    local: "São Paulo",
    endereco: "Autódromo de Interlagos, Av. Sen. Teotônio Vilela, 261",
    cep: "04801-010",
    dataInicio: new Date("2026-03-27T12:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    ingressos: [
      { nome: "1 Dia", preco: 650, quantidade: 20000 },
      { nome: "3 Dias", preco: 1600, quantidade: 15000 },
      { nome: "Lolla Lounge", preco: 3500, quantidade: 2000 }
    ]
  },
  {
    titulo: "Festival Literário de Paraty",
    descricao: "FLIP - Encontro de autores e leitores do mundo todo.",
    categoria: "Festivais",
    local: "Paraty",
    endereco: "Centro Histórico, Praça da Matriz",
    cep: "23970-000",
    dataInicio: new Date("2026-07-29T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
    ingressos: [
      { nome: "Day Pass", preco: 60, quantidade: 1500 },
      { nome: "Full Week", preco: 200, quantidade: 500 }
    ]
  },

  // OUTROS
  {
    titulo: "Feira de Adoção de Animais",
    descricao: "Encontre seu novo melhor amigo de quatro patas.",
    categoria: "Outros",
    local: "São Paulo",
    endereco: "Parque do Ibirapuera, Av. Pedro Álvares Cabral",
    cep: "04094-050",
    dataInicio: new Date("2025-11-30T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800",
    ingressos: [
      { nome: "Gratuito", preco: 0, quantidade: 3000 }
    ]
  },
  {
    titulo: "Mercado de Pulgas Vintage",
    descricao: "Antiguidades, vinis, roupas e objetos vintage.",
    categoria: "Outros",
    local: "Rio de Janeiro",
    endereco: "Praça XV de Novembro",
    cep: "20010-010",
    dataInicio: new Date("2025-12-14T09:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    ingressos: [
      { nome: "Gratuito", preco: 0, quantidade: 5000 }
    ]
  },
  {
    titulo: "Festival de Pipas",
    descricao: "Competição e shows de acrobacias com pipas.",
    categoria: "Outros",
    local: "Salvador",
    endereco: "Praia de Itapuã",
    cep: "41620-610",
    dataInicio: new Date("2025-09-07T08:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800",
    ingressos: [
      { nome: "Gratuito", preco: 0, quantidade: 10000 }
    ]
  },

  // EVENTOS ADICIONAIS PARA COMPLETAR 50+
  {
    titulo: "Feijoada Cultural",
    descricao: "Feijoada com roda de samba ao vivo.",
    categoria: "Festas_e_Shows",
    local: "Rio de Janeiro",
    endereco: "Pedra do Sal, Rua Argemiro Bulcão",
    cep: "20220-370",
    dataInicio: new Date("2025-11-23T12:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    ingressos: [
      { nome: "Individual", preco: 80, quantidade: 500 }
    ]
  },
  {
    titulo: "Exposição de Carros Antigos",
    descricao: "Raridades automobilísticas de 1920 a 1980.",
    categoria: "Outros",
    local: "São Paulo",
    endereco: "Anhembi Parque, Av. Olavo Fontoura, 1209",
    cep: "02012-021",
    dataInicio: new Date("2025-10-25T10:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
    ingressos: [
      { nome: "Inteira", preco: 40, quantidade: 3000 },
      { nome: "Meia", preco: 20, quantidade: 2000 }
    ]
  },
  {
    titulo: "Noite do Hambúrguer Artesanal",
    descricao: "Competição entre os melhores hambúrgueres da cidade.",
    categoria: "Gastronomia",
    local: "Belo Horizonte",
    endereco: "Praça da Liberdade",
    cep: "30140-010",
    dataInicio: new Date("2025-12-19T18:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    ingressos: [
      { nome: "Passaporte Degustação", preco: 60, quantidade: 2000 }
    ]
  },
  {
    titulo: "Retiro de Meditação",
    descricao: "Fim de semana de introspecção e paz interior.",
    categoria: "Saude",
    local: "Campos do Jordão",
    endereco: "Spa Mountain Resort, Estrada Municipal, km 3",
    cep: "12460-000",
    dataInicio: new Date("2025-11-29T16:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    ingressos: [
      { nome: "Quarto Individual", preco: 800, quantidade: 30 },
      { nome: "Quarto Compartilhado", preco: 400, quantidade: 60 }
    ]
  },
  {
    titulo: "Baile de Máscaras Veneziano",
    descricao: "Noite elegante com trajes de época e máscaras.",
    categoria: "Festas_e_Shows",
    local: "São Paulo",
    endereco: "Palácio dos Cedros, Av. Higienópolis, 18",
    cep: "01238-000",
    dataInicio: new Date("2025-12-28T21:00:00"),
    imagemBanner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    ingressos: [
      { nome: "Individual", preco: 300, quantidade: 400 }
    ]
  }
];

/**
 * Função principal para popular o banco de dados
 */
async function popularEventos() {
  console.log("🚀 Iniciando processo de criação de eventos...");
  
  let eventosInseridos = 0;
  let erros = 0;

  for (const eventoData of eventosData) {
    try {
      // 1. Buscar ou criar categoria
      let categoriaID;
      const catQuery = query(
        collection(db, "Categoria"), 
        where("nome", "==", eventoData.categoria)
      );
      const catSnap = await getDocs(catQuery);

      if (!catSnap.empty) {
        categoriaID = catSnap.docs[0].id;
        console.log(`✅ Categoria ${eventoData.categoria} já existe`);
      } else {
        const catRef = await addDoc(collection(db, "Categoria"), {
          nome: eventoData.categoria,
          descricao: `Categoria de ${eventoData.categoria}`,
          dataCriacao: serverTimestamp()
        });
        categoriaID = catRef.id;
        console.log(`✨ Nova categoria criada: ${eventoData.categoria}`);
      }

      // 2. Criar Local
      const localRef = await addDoc(collection(db, "Local"), {
        endereco: eventoData.endereco,
        cep: eventoData.cep,
        cidade: eventoData.local,
        dataCriacao: serverTimestamp()
      });

      // 3. Criar Evento
      const eventoRef = await addDoc(collection(db, "Evento"), {
        titulo: eventoData.titulo,
        descricao: eventoData.descricao,
        dataInicio: eventoData.dataInicio,
        dataFim: eventoData.dataInicio,
        imagemBanner: eventoData.imagemBanner,
        organizadorID: "sistema", // ID fictício
        categoriaID: categoriaID,
        localID: localRef.id,
        local: eventoData.local,
        status: "ativo",
        dataCriacao: serverTimestamp()
      });

      // 4. Criar Lotes (Ingressos)
      for (const ingresso of eventoData.ingressos) {
        await addDoc(collection(db, "Lote"), {
          eventoID: eventoRef.id,
          nome: ingresso.nome,
          preco: ingresso.preco,
          quantidade: ingresso.quantidade,
          dataInicio: serverTimestamp(),
          dataFim: eventoData.dataInicio,
          usuarioID: "sistema"
        });
      }

      eventosInseridos++;
      console.log(`✅ ${eventosInseridos}. ${eventoData.titulo} criado com sucesso!`);

    } catch (error) {
      erros++;
      console.error(`❌ Erro ao criar ${eventoData.titulo}:`, error.message);
    }
  }

  console.log("\n=================================");
  console.log(`🎉 Processo concluído!`);
  console.log(`✅ Eventos inseridos: ${eventosInseridos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log("=================================\n");
}

// Exportar função para uso
export { popularEventos };