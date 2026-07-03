import { db } from "./firebaseConfig.js";
import { doc, getDoc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { $, getCurrentUser, hydrateHeader, renderAppHeader, showMessage } from "./ui.js";

renderAppHeader();
hydrateHeader();

const form = $("#perfilForm");
let session = null;

async function carregar() {
  session = await getCurrentUser({ required: true });
  const snap = await getDoc(doc(db, "Usuario", session.user.uid));
  const perfil = snap.exists() ? snap.data() : session.profile;
  $("#nome").value = perfil.nome || "";
  $("#email").value = session.user.email || perfil.email || "";
  $("#telefone").value = perfil.telefone || "";
  $("#cpf").value = perfil.cpf || "";
  $("#dataNascimento").value = perfil.dataNascimento || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await setDoc(doc(db, "Usuario", session.user.uid), {
      nome: $("#nome").value.trim(),
      email: session.user.email,
      telefone: $("#telefone").value.trim(),
      cpf: $("#cpf").value.trim(),
      dataNascimento: $("#dataNascimento").value,
      atualizadoEm: serverTimestamp()
    }, { merge: true });
    showMessage("Perfil atualizado com sucesso.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

carregar();
