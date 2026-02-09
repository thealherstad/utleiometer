import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEgUujSBDlON-2k7Nqm_k3OD3X7Vq33DE",
  authDomain: "utleiometer.firebaseapp.com",
  projectId: "utleiometer",
  storageBucket: "utleiometer.firebasestorage.app",
  messagingSenderId: "818670052374",
  appId: "1:818670052374:web:3618350623a32a129a0137"
};

console.log("🔥 Initialiserer Firebase...");
const app = initializeApp(firebaseConfig);
console.log("✅ Firebase initialisert");

console.log("📚 Initialiserer Firestore...");
export const db = getFirestore(app);
console.log("✅ Firestore initialisert");
console.log("📋 Firestore database:", db);
