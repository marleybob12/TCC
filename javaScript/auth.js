// Importa as configurações do Firebase e os módulos necessários
import { auth, db } from "./firebaseConfig.js";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/** 
 * Função para cadastrar um novo usuário no sistema.
 * Cria uma conta de autenticação e armazena os dados no Firestore.
 * @param {string} nome - Nome do usuário
 * @param {string} email - Email do usuário
 * @param {string} telefone - Telefone do usuário
 * @param {string} cpf - CPF do usuário
 * @param {string} dataNascimento - Data de nascimento do usuário
 * @param {string} senha - Senha do usuário
 * @returns {object} - Objeto do usuário criado
 */
export async function cadastrarUsuario(nome, email, telefone, cpf, dataNascimento, senha) {
  try {
    // Cria o usuário na autenticação do Firebase
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const user = cred.user;

    // Salva os dados adicionais do usuário no Firestore
    await setDoc(doc(db, "Usuario", user.uid), {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento
    });

    return user;
  } catch (error) {
    // Trata erros específicos de autenticação
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error("Este email já está em uso.");
      case 'auth/invalid-email':
        throw new Error("Email inválido.");
      default:
        throw new Error("Erro ao criar conta.");
    }
  }
}

/** 
 * Função para realizar login de um usuário.
 * Redireciona para a página inicial após login bem-sucedido.
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {object} - Objeto do usuário autenticado
 */
export async function loginUsuario(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  window.location.href = "../home/home.html"; // Redireciona após login
  return cred.user;
}

/** 
 * Função para realizar logout do usuário.
 * Encerra a sessão atual do usuário.
 */
export async function logoutUsuario() {
  await signOut(auth);
}
