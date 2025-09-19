// Importa os módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Configuração do Firebase (substitua pelos dados do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyAMV0Fbn-3bUCu6-Vn3182MYWEqrJsqZPM",
  authDomain: "eventflow-87d51.firebaseapp.com",
  databaseURL: "https://eventflow-87d51-default-rtdb.firebaseio.com",
  projectId: "eventflow-87d51",
  storageBucket: "eventflow-87d51.appspot.com",
  messagingSenderId: "1060995756519",
  appId: "1:1060995756519:web:1963ecc800497812630d42"
};

// Inicializa o Firebase e exporta as instâncias necessárias
// Inicializa Firebase apenas uma vez
const app = initializeApp(firebaseConfig);

// Exporta instâncias únicas
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
