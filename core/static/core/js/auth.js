// core/static/core/js/auth.js

// 1. Import the auth service
import { auth } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');

// Toggle between login and signup views (this part is unchanged)
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

    // 2. Use the new function names
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

    // 3. Use the new function names
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            window.location.href = '/'; 
        })
        .catch(error => {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        });
});