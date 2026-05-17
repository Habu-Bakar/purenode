import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDYWz5NiwbEuR_9UMTWH_E1lRRAe_P-yUw",
  authDomain: "purenode-9bdba.firebaseapp.com",
  projectId: "purenode-9bdba",
  storageBucket: "purenode-9bdba.firebasestorage.app",
  messagingSenderId: "596395301517",
  appId: "1:596395301517:web:e9c1f4f1c117e4ed3e20c4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
