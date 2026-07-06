import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiccBr8Nbw9OiXkkUxwTx_uQZ4Xxmh1_4",
  authDomain: "veritas-b02e0.firebaseapp.com",
  projectId: "veritas-b02e0",
  storageBucket: "veritas-b02e0.firebasestorage.app",
  messagingSenderId: "40953667224",
  appId: "1:40953667224:web:e414d966e4cf980dbf7aed",
  measurementId: "G-NT445XBNLN",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
