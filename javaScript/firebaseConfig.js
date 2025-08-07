// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// firebaseConfig.js
export const firebaseConfig = {
  apiKey: "AIzaSyAMV0Fbn-3bUCu6-Vn3182MYWEqrJsqZPM",
  authDomain: "eventflow-87d51.firebaseapp.com",
  databaseURL: "https://eventflow-87d51-default-rtdb.firebaseio.com",
  projectId: "eventflow-87d51",
  storageBucket: "eventflow-87d51.appspot.com", // corrigido para .appspot.com
  messagingSenderId: "1060995756519",
  appId: "1:1060995756519:web:1963ecc800497812630d42"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);