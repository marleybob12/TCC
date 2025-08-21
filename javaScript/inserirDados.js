// inserirDados.js
import { 
  doc, setDoc, addDoc, collection, serverTimestamp, getDocs, query, where, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Função para cadastrar um usuário simples (participante)
 */
export async function inserirDadosUsuario(db, usuarioID, nome, email, telefone, cpf, dataNascimento) {
  try {
    await setDoc(doc(db, "Usuario", usuarioID), {
      usuarioID,
      nome,
      email,
      telefone: telefone || null,
      cpf,
      dataNascimento,
      tipo: "participante", // todo novo usuário é participante
      dataCriacao: serverTimestamp() // padronizado
    });

    console.log(" Usuário participante cadastrado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir dados do usuário:", error);
    throw error;
  }
}

/**
 * Função para cadastrar usuário como organizador e criar evento completo
 */
export async function inserirDadosComOrganizador(
  db,
  usuarioID,
  nome,
  email,
  telefone,
  cpf,
  dataNascimento,
  eventoData
) {
  try {
    // 1. Criar/atualizar documento do usuário
    await setDoc(doc(db, "Usuario", usuarioID), {
      nome,
      email,
      telefone: telefone || null,
      cpf,
      dataNascimento,
      tipo: "organizador",
      dataCriacao: serverTimestamp() // padronizado
    });

    // 2. Criar documento em Organizador
    const organizadorRef = await addDoc(collection(db, "Organizador"), {
      usuarioID,
      nomeOrganizacao: "Organização do " + nome,
      cnpj: eventoData.cnpj || null,
      dataCriacao: serverTimestamp() // padronizado
    });

    // 3. Verificar se Categoria já existe
    let categoriaRef;
    const q = query(
      collection(db, "Categoria"),
      where("nome", "==", eventoData.tipo)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      categoriaRef = querySnapshot.docs[0].ref; // pega a já existente
    } else {
      categoriaRef = await addDoc(collection(db, "Categoria"), {
        nome: eventoData.tipo,
        descricao: "Categoria vinculada ao evento",
        dataCriacao: serverTimestamp() //  padronizado
      });
    }

    // 4. Criar Local
    const localRef = await addDoc(collection(db, "Local"), {
      nome: eventoData.local,
      endereco: eventoData.endereco,
      cep: eventoData.cep,
      dataCriacao: serverTimestamp() // padronizado
    });

    // 5. Criar Evento
    const dataEvento = new Date(`${eventoData.data}T${eventoData.hora}`);
    const eventoRef = await addDoc(collection(db, "Evento"), {
      titulo: eventoData.nome,
      descricao: eventoData.descricao,
      dataInicio: dataEvento,
      dataFim: dataEvento,
      imagemBanner: eventoData.bannerUrl || "",
      organizadorID: organizadorRef.id,
      categoriaID: categoriaRef.id,
      localID: localRef.id,
      status: "ativo",
      dataCriacao: serverTimestamp() //  padronizado
    });

    // 6. Criar Lote vinculado ao Evento
    await addDoc(collection(db, "Lote"), {
      eventoID: eventoRef.id,
      nome: "Lote Único",
      preco: parseFloat(eventoData.preco),
      quantidade: parseInt(eventoData.quantidade, 10),
      dataInicio: serverTimestamp(),
      dataFim: dataEvento
    });

    console.log("Evento criado com sucesso!");
  } catch (error) {
    console.error(" Erro ao inserir dados:", error.message);
    throw error;
  }
}
