import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAzQ2_dV-_9EQXDKhoTdMxyDYJYtLlnw50",
  authDomain: "crypto-ivy-dn50x.firebaseapp.com",
  projectId: "crypto-ivy-dn50x",
  storageBucket: "crypto-ivy-dn50x.firebasestorage.app",
  messagingSenderId: "646507566531",
  appId: "1:646507566531:web:da4faa7d2b846e28f75976",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-takanitinventory-bdc2bd41-5e88-46ae-abcf-a19c98ed630a");
