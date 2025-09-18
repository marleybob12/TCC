// auth.js
import { auth, db } from "./firebaseConfig.js";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/** Cadastro de usuário */
export async function cadastrarUsuario(nome, email, telefone, cpf, dataNascimento, senha) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const user = cred.user;

    await setDoc(doc(db, "Usuario", user.uid), {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento
    });

    return user;
  } catch (error) {
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

/** Login de usuário */
export async function loginUsuario(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  // Redirecionar para home.html após login bem-sucedido
  window.location.href = "../home/home.html";
  return cred.user;
}

/** Logout */
export async function logoutUsuario() {
  await signOut(auth);
}
