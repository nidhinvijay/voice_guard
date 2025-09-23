  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
