// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Você precisa importar o getAuth e o getFirestore!
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4A9ACsSdadDwmLiXPgC5zWFGcQyvAJNo",
  authDomain: "nandinhabet-be02d.firebaseapp.com",
  projectId: "nandinhabet-be02d",
  storageBucket: "nandinhabet-be02d.firebasestorage.app",
  messagingSenderId: "291032065911",
  appId: "1:291032065911:web:f1b64d3d649c2cdc326372"
};

// Initialize Firebase
// Inicializa o app principal
const app = initializeApp(firebaseConfig);

// Estas são as duas linhas cruciais que o TypeScript estava sentindo falta!
export const auth = getAuth(app);
export const db = getFirestore(app);