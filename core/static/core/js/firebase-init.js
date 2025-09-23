  // Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use

const firebaseConfig = {
  apiKey: "AIzaSyDZmvbmAuOuoZu0q9X3_2Xu22-4VmzP8ss",
  authDomain: "voiceguard-app.firebaseapp.com",
  projectId: "voiceguard-app",
  storageBucket: "voiceguard-app.firebasestorage.app",
  messagingSenderId: "121323288581",
  appId: "1:121323288581:web:5f6ddcd23d2a159461446c",
  measurementId: "G-ZYDSXTQXYF"
};  

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// EXPORT the services for other files to use. This is the fix.
export const auth = getAuth(app);
export const db = getDatabase(app);