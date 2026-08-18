import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCb_MmtL6HQb_3SnfP7QLln4MdjPSV9jCA",
  authDomain: "mza-agrotours-dev-john.firebaseapp.com",
  projectId: "mza-agrotours-dev-john",
  storageBucket: "mza-agrotours-dev-john.firebasestorage.app",
  messagingSenderId: "176665133777",
  appId: "1:176665133777:web:79860464d91c09b845fbf0",
  measurementId: "G-N02ZD7SMH1",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
