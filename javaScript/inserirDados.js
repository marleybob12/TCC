// inserirDados.js
import { doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Função exportada para ser usada no cadastro
export async function inserirDadosComOrganizador(db, usuarioID, nome, email, telefone, cpf, dataNascimento) {
  try {
    // 1. Criar usuário no Firestore
    await setDoc(doc(db, "Usuario", usuarioID), {
      nome: nome,
      email: email,
      telefone: telefone || null,
      cpf: cpf,
      dataNascimento: dataNascimento,
      tipo: "participante"
    });

    // 2. Criar organizador (ajuste aqui conforme sua lógica de negócios)
    const organizadorRef = await addDoc(collection(db, "Organizador"), {
      usuarioID: usuarioID,
      nomeOrganizacao: "Eventos Tech LTDA",
      cnpj: "12345678000199"
    });

    // 3. Criar categoria
    const categoriaRef = await addDoc(collection(db, "Categoria"), {
      nome: "Tecnologia",
      descricao: "Eventos de tecnologia e inovação"
    });

    // 4. Criar local
    const localRef = await addDoc(collection(db, "Local"), {
      nome: "Centro de Convenções",
      endereco: "Rua Exemplo, 100, Centro, São Paulo, SP",
      cep: "01000-000"
    });

    // 5. Criar evento
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

    // 6. Criar lote
    const loteRef = await addDoc(collection(db, "Lote"), {
      eventoID: eventoRef.id,
      nome: "Lote Promocional",
      preco: 80.00,
      quantidade: 100,
      dataInicio: new Date("2025-07-01T00:00:00").toISOString(),
      dataFim: new Date("2025-08-01T23:59:59").toISOString()
    });

    // 7. Criar inscrição
    const inscricaoRef = await addDoc(collection(db, "Inscricao"), {
      usuarioID: usuarioID,
      eventoID: eventoRef.id,
      status: "confirmada",
      dataInscricao: new Date().toISOString()
    });

    // 8. Criar ingresso
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

    console.log("Dados inseridos com sucesso!");
  } catch (error) {
    console.error("Erro ao inserir dados:", error);
  }
}
