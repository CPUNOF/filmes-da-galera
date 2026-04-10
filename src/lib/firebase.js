import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 👈 1. Importamos o Auth aqui

const firebaseConfig = {
  apiKey: "AIzaSyB2WZgeCO5kYUTLmqtGWWAgbFDIHLlnepM",
  authDomain: "filmes-da-galera.firebaseapp.com",
  projectId: "filmes-da-galera",
  storageBucket: "filmes-da-galera.firebasestorage.app",
  messagingSenderId: "1051294416373",
  appId: "1:1051294416373:web:009bd580ef7a570f6b34bc"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app); // 👈 2. Ligamos o Auth aqui

export { db, auth }; // 👈 3. Exportamos os dois juntos