import { auth } from "./firebaseConfig.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showMessage } from "./ui.js";

document.getElementById("resetForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await sendPasswordResetEmail(auth, document.getElementById("email").value.trim());
    showMessage("Link de recuperação enviado. Confira seu e-mail.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
});
