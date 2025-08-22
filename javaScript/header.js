import { auth, db, logoutUsuario } from "../javaScript/firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Dropdown usuário
const userAccount = document.getElementById("userAccount");
const dropdown = document.getElementById("dropdown");

if (userAccount && dropdown) {
  userAccount.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });

  window.addEventListener("click", () => {
    dropdown.style.display = "none";
  });
}

// Menu mobile
const menuIcon = document.getElementById("menu-icon");
if (menuIcon) {
  menuIcon.addEventListener("click", () => {
    document.querySelector("header nav ul")?.classList.toggle("show");
  });
}

// Logout
const logoutBtn = document.getElementById("dropdownLogout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUsuario();
    window.location.href = "../login.html";
  });
}

// Atualiza nome do usuário
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  try {
    const userDoc = await getDoc(doc(db, "Usuario", user.uid));
    if (userDoc.exists()) {
      document.querySelector(".user-name").textContent = userDoc.data().nome;
    }
  } catch (e) {
    console.error("Erro ao buscar dados do usuário:", e);
  }
});
