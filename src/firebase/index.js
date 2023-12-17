import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkJigAoyslbMpuatnjHATnV9Vy3x4SE5M",
  authDomain: "portfolio-538b5.firebaseapp.com",
  projectId: "portfolio-538b5",
  storageBucket: "portfolio-538b5.appspot.com",
  messagingSenderId: "1006669547907",
  appId: "1:1006669547907:web:cb182b15f79612478d8eb6"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default db;