// core/static/core/js/auth.js

// --- 1. FIREBASE INITIALIZATION (MOVED HERE) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// The firebaseConfig object is now defined globally in the HTML template by Django.
// Make sure this is still in your login.html template!
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// --- 2. THE REST OF YOUR AUTH LOGIC (UNCHANGED) ---
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');

// Toggle between login and signup views
document.getElementById('show-signup').addEventListener('click', () => {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('signup-view').style.display = 'block';
});
document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('signup-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'block';
});

// Handle Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            alert('Account created! Please log in.');
            window.location.reload();
        })
        .catch(error => {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        });
});

// Handle Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            window.location.href = '/'; 
        })
        .catch(error => {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        });
});