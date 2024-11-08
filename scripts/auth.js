 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const FirebaseConfig = {
    apiKey: "AIzaSyDSbE8JH6olu09Ej4Yc92hrgHB2jh04wQQ",
    authDomain: "coffee-shop-c124f.firebaseapp.com",
    projectId: "coffee-shop-c124f",
    storageBucket: "coffee-shop-c124f.appspot.com",
    messagingSenderId: "546904036685",
    appId: "1:546904036685:web:1c0530824f228f72849304",
    measurementId: "G-Y6H5WQJMG3"
};

const App = initializeApp(FirebaseConfig);
const Auth = getAuth(App);

const EmailLoginForm = document.getElementById('email-login-form');
const EmailInput = document.getElementById('email');
const MessageDiv = document.getElementById('message');

const ActionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
};

EmailLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = EmailInput.value.trim().toLowerCase();

    if (email.endsWith('@hsestudents.org') || email.endsWith('@hse.k12.in.us')) {
        sendSignInLinkToEmail(Auth, email, ActionCodeSettings)
            .then(() => {
                window.localStorage.setItem('ClientEmail', email);
                MessageDiv.innerHTML = 'A sign-in link has been sent to your email. Please make sure to check your spam folder.';
                EmailLoginForm.reset();
            })
    } else {
        MessageDiv.innerHTML = 'This email is not allowed';
    }
});

if (isSignInWithEmailLink(Auth, window.location.href)) {
    let email = window.localStorage.getItem('ClientEmail');
    if (email && (email.endsWith('@hsestudents.org') || email.endsWith('@hse.k12.in.us'))) {
        signInWithEmailLink(Auth, email, window.location.href)
            .then((result) => {
                window.localStorage.removeItem('ClientEmail');
                MessageDiv.innerHTML = `Successfully signed in as ${result.user.email}`;
            })
            .catch((error) => {
                console.error("Error signing in with email link:", error);
                MessageDiv.innerHTML = `Error: ${error.message}`;
            });
    } else if (email) {
        MessageDiv.innerHTML = 'This email is not allowed';
    }
}