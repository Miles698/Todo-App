// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzxxjZ_urWQXeCXFQGkDW-YnYlS5NUIFE",
  authDomain: "todo-app-cb297.firebaseapp.com",
  projectId: "todo-app-cb297",
  storageBucket: "todo-app-cb297.appspot.com", // ← fixed typo here
  messagingSenderId: "442563936589",
  appId: "1:442563936589:web:285f3482538004c14bf704",
  measurementId: "G-YLQTDYX17L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
