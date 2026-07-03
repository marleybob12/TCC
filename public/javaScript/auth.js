import { auth, db } from "./firebaseConfig.js";
import { showMessage } from "./ui.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function redirectAfterLogin() {
  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/home/home.html";
  window.location.href = redirect;
}

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    showMessage("Login realizado com sucesso.", "success");
    redirectAfterLogin();
  } catch (error) {
    showMessage(error.code === "auth/invalid-credential" ? "E-mail ou senha inválidos." : error.message, "error");
  }
});

const cadastroForm = document.getElementById("cadastroForm");
cadastroForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const dataNascimento = document.getElementById("dataNascimento").value;
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;

  if (senha !== confirmarSenha) return showMessage("As senhas não conferem.", "error");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "Usuario", cred.user.uid), {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      tipo: "usuario",
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    showMessage("Conta criada com sucesso.", "success");
    window.location.href = "/home/home.html";
  } catch (error) {
    const msg = error.code === "auth/email-already-in-use" ? "Este e-mail já está em uso." : error.message;
    showMessage(msg, "error");
  }
});
