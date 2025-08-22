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
}

/** Login de usuário */
export async function loginUsuario(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

/** Logout */
export async function logoutUsuario() {
  await signOut(auth);
}
