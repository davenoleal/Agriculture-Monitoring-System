import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAau1f7-JwPleqZGJoGvfB1Y3rY2TpiEZ0",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "agriculture-monitoring-s-ffee9.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "agriculture-monitoring-s-ffee9",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "agriculture-monitoring-s-ffee9.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "946937475610",
  appId: env.VITE_FIREBASE_APP_ID || "1:946937475610:web:74a09c9890a17cadb497a3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const ADMIN_UID = "f1Vb911OgwTvPFB1wl4WGgiL8au2";
