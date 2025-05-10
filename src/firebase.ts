import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDnz0UcTNj_bp-cKo33NF-01QEZLaanH1E",
  authDomain: "kadsheim.firebaseapp.com",
  projectId: "kadsheim",
  storageBucket: "kadsheim.firebasestorage.app",
  messagingSenderId: "702162920523",
  appId: "1:702162920523:web:5603c86ca911090c2559ce",
  measurementId: "G-H913XDR0Y2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db };

