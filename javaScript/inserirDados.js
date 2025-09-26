// inserirDados.js
import { 
  doc, setDoc, addDoc, collection, serverTimestamp, getDocs, query, where, getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Função para cadastrar um usuário simples (participante)
 */
export async function inserirDadosUsuario(db, usuarioID, nome, email, telefone, cpf, dataNascimento) {
  try {
    if (!usuarioID || !nome || !email || !cpf || !dataNascimento) {
      throw new Error("Campos obrigatórios incompletos.");
    }

    await setDoc(doc(db, "Usuario", usuarioID), {
      usuarioID,
      nome,
      email,
      telefone: telefone || null,
      cpf,
      dataNascimento,
      tipo: "participante",
      dataCriacao: serverTimestamp()
    });

    console.log("✅ Usuário participante cadastrado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir dados do usuário:", error.message);
    throw error;
  }
}

/**
 * Função para criar evento e garantir que o usuário seja organizador
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
    // Valida campos essenciais
    if (!usuarioID || !nome || !eventoData || !eventoData.nome || !eventoData.tipo || !eventoData.data || !eventoData.hora) {
      throw new Error("Dados essenciais do usuário ou do evento estão faltando.");
    }

    // 1. Buscar ou criar usuário
    const userRef = doc(db, "Usuario", usuarioID);
    const userSnap = await getDoc(userRef);
    let userData = userSnap.exists() ? userSnap.data() : null;

    if (userData && userData.tipo !== "organizador") {
      await setDoc(userRef, { tipo: "organizador" }, { merge: true });
      userData = { ...userData, tipo: "organizador" };
      console.log("✅ Usuário promovido a organizador automaticamente.");
    }

    if (!userData) {
      // Se usuário não existe, cria como organizador
      await setDoc(userRef, {
        usuarioID,
        nome,
        email,
        telefone: telefone || null,
        cpf,
        dataNascimento,
        tipo: "organizador",
        dataCriacao: serverTimestamp()
      });
      console.log("✅ Usuário criado como organizador.");
    }

    // 2. Criar documento em Organizador
    const organizadorRef = await addDoc(collection(db, "Organizador"), {
      usuarioID,
      nomeOrganizacao: "Organização do " + nome,
      cnpj: eventoData.cnpj || null,
      dataCriacao: serverTimestamp()
    });

    // 3. Verificar se categoria existe
    let categoriaRef;
    const q = query(collection(db, "Categoria"), where("nome", "==", eventoData.tipo));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      categoriaRef = querySnapshot.docs[0].ref;
      console.log("✅ Categoria existente utilizada.");
    } else {
      categoriaRef = await addDoc(collection(db, "Categoria"), {
        nome: eventoData.tipo,
        descricao: eventoData.descricaoCategoria || "Categoria vinculada ao evento",
        dataCriacao: serverTimestamp()
      });
      console.log("✅ Nova categoria criada.");
    }

    // 4. Criar Local
    const localRef = await addDoc(collection(db, "Local"), {
      endereco: eventoData.endereco || "A definir",
      cep: eventoData.cep || null,
      dataCriacao: serverTimestamp()
    });
    console.log("✅ Local criado com sucesso.");

    // 5. Criar Evento
    const dataEvento = new Date(`${eventoData.data}T${eventoData.hora}:00`);
    const eventoRef = await addDoc(collection(db, "Evento"), {
      titulo: eventoData.nome,
      descricao: eventoData.descricao || "Descrição não informada",
      dataInicio: dataEvento,
      dataFim: dataEvento,
      imagemBanner: eventoData.bannerUrl || "",
      organizadorID: usuarioID,
      categoriaID: categoriaRef.id,
      localID: localRef.id,
      status: "ativo",
      dataCriacao: serverTimestamp()
    });
    console.log("✅ Evento criado com sucesso.");

    // 6. Criar Lotes (Ingressos)
    if (Array.isArray(eventoData.ingressos) && eventoData.ingressos.length > 0) {
      for (const ingresso of eventoData.ingressos) {
        if (!ingresso.nome || !ingresso.preco || !ingresso.quantidade) {
          console.warn("⚠️ Ingresso inválido ignorado:", ingresso);
          continue;
        }
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
    } else {
      console.log("⚠️ Nenhum lote informado.");
    }

    console.log("✅ Todos os dados foram inseridos com sucesso.");

  } catch (error) {
    console.error("❌ Erro ao inserir dados:", error.message);
    throw error;
  }
}
