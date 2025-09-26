// popularDadosTeste.js
import { inserirDadosComOrganizador } from "./inserirDados.js";

/**
 * Função para popular Firestore com eventos de teste
 * @param {object} db - instância do Firestore
 * @param {string} usuarioID - UID do usuário organizador
 */
export async function popularEventosTeste(db, usuarioID) {
  try {
    const eventosTeste = [
      {
        nome: "Show de Rock",
        descricao: "Uma noite inesquecível com bandas de rock locais.",
        tipo: "Música",
        endereco: "Rua das Estrelas, 123",
        cep: "01000-000",
        data: "2025-09-20",
        hora: "20:00",
        bannerUrl: "../img/evento_rock.jpg",
        ingressos: [
          { nome: "Pista", preco: "50", quantidade: "100" },
          { nome: "VIP", preco: "120", quantidade: "50" }
        ]
      },
      {
        nome: "Torneio de Vôlei",
        descricao: "Competição regional de vôlei de quadra.",
        tipo: "Esportes",
        endereco: "Ginásio Municipal, Av. Central, 50",
        cep: "02000-000",
        data: "2025-10-05",
        hora: "09:00",
        bannerUrl: "../img/evento_volei.jpg",
        ingressos: [
          { nome: "Ingresso Adulto", preco: "20", quantidade: "200" },
          { nome: "Ingresso Criança", preco: "10", quantidade: "100" }
        ]
      },
      {
        nome: "Workshop de Pintura",
        descricao: "Aprenda técnicas de pintura com artistas renomados.",
        tipo: "Artes",
        endereco: "Centro Cultural, Rua das Artes, 75",
        cep: "03000-000",
        data: "2025-09-30",
        hora: "14:00",
        bannerUrl: "../img/evento_arte.jpg",
        ingressos: [
          { nome: "Entrada", preco: "30", quantidade: "50" }
        ]
      }
    ];

    for (const evento of eventosTeste) {
      await inserirDadosComOrganizador(
        db,
        usuarioID,
        "Organizador Teste", // nome do organizador
        "teste@eventflow.com", // email
        "11999999999", // telefone
        "000.000.000-00", // cpf
        "1990-01-01", // data nascimento
        evento
      );
    }

    console.log("✅ Eventos de teste inseridos com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular eventos de teste:", error.message);
  }
}
