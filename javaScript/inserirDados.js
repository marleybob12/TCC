// inserirDados.js
import { 
  doc, setDoc, addDoc, collection, serverTimestamp, getDocs, query, where, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Insere os dados de um novo usuário no Firestore.
 * @param {object} db - Instância do Firestore
 * @param {string} usuarioID - ID do usuário
 * @param {string} nome - Nome do usuário
 * @param {string} email - Email do usuário
 * @param {string} telefone - Telefone do usuário
 * @param {string} cpf - CPF do usuário
 * @param {string} dataNascimento - Data de nascimento do usuário
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
      dataCriacao: serverTimestamp()
    });

    console.log("✅ Usuário participante cadastrado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir dados do usuário:", error);
    throw error;
  }
}

/**
 * Insere os dados de um evento e promove o usuário a organizador, se necessário.
 * @param {object} db - Instância do Firestore
 * @param {string} usuarioID - ID do usuário
 * @param {string} nome - Nome do organizador
 * @param {string} email - Email do organizador
 * @param {string} telefone - Telefone do organizador
 * @param {string} cpf - CPF do organizador
 * @param {string} dataNascimento - Data de nascimento do organizador
 * @param {object} eventoData - Dados do evento
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
    const userRef = doc(db, "Usuario", usuarioID);
    const userSnap = await getDoc(userRef);
    let userData = userSnap.exists() ? userSnap.data() : null;

    // Se o usuário existe e não é organizador, promove a organizador
    if (userData && userData.tipo !== "organizador") {
      await setDoc(userRef, { tipo: "organizador" }, { merge: true });
      userData = { ...userData, tipo: "organizador" }; // garante consistência
      console.log("✅ Usuário promovido a organizador automaticamente.");
    }

    // Criar documento em Organizador
    const organizadorRef = await addDoc(collection(db, "Organizador"), {
      usuarioID,
      nomeOrganizacao: "Organização do " + nome,
      cnpj: eventoData.cnpj || null,
      dataCriacao: serverTimestamp()
    });

    // Verificar se Categoria já existe
    let categoriaRef;
    const q = query(
      collection(db, "Categoria"),
      where("nome", "==", eventoData.tipo)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      categoriaRef = querySnapshot.docs[0].ref;
      console.log("✅ Categoria existente utilizada.");
    } else {
      categoriaRef = await addDoc(collection(db, "Categoria"), {
        nome: eventoData.tipo,
        descricao: "Categoria vinculada ao evento",
        dataCriacao: serverTimestamp()
      });
      console.log("✅ Nova categoria criada.");
    }

    // Criar Local
    const localRef = await addDoc(collection(db, "Local"), {
      endereco: eventoData.endereco,
      cep: eventoData.cep,
      dataCriacao: serverTimestamp()
    });
    console.log("✅ Local criado com sucesso.");

    // Criar Evento
    const dataEvento = new Date(`${eventoData.data}T${eventoData.hora}`);
    const eventoRef = await addDoc(collection(db, "Evento"), {
      titulo: eventoData.nome,
      descricao: eventoData.descricao,
      dataInicio: dataEvento,
      dataFim: dataEvento,
      imagemBanner: eventoData.bannerUrl || "",
      organizadorID: usuarioID, // usa o UID do usuário atual
      categoriaID: categoriaRef.id,
      localID: localRef.id,
      status: "ativo",
      dataCriacao: serverTimestamp()
    });
    console.log("✅ Evento criado com sucesso.");

    // Criar Lotes (vários ingressos)
    for (const ingresso of eventoData.ingressos) {
      await addDoc(collection(db, "Lote"), {
        eventoID: eventoRef.id,
        nome: ingresso.nome,
        preco: parseFloat(ingresso.preco),
        quantidade: parseInt(ingresso.quantidade, 10),
        dataInicio: serverTimestamp(),
        dataFim: dataEvento
      });
    }
    console.log("✅ Lotes do evento criados com sucesso.");
    console.log("✅ Todos os dados foram inseridos com sucesso.");

  } catch (error) {
    console.error("❌ Erro ao inserir dados:", error.message);
    throw error;
  }
}
