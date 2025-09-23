// core/static/core/js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Uses the firebaseConfig object that is now safely attached to the window
const app = initializeApp(window.firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);