import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-analytics.js";

const FirebaseConfig = {
    apiKey: "AIzaSyCDj5RzphqO_wC-fSWrqSUo3ffNGQFsKrs",
    authDomain: "coffee-shop-69af4.firebaseapp.com",
    projectId: "coffee-shop-69af4",
    storageBucket: "coffee-shop-69af4.firebasestorage.app",
    messagingSenderId: "281527813455",
    appId: "1:281527813455:web:ea1a52942fb0c3ccdaf13a",
    measurementId: "G-Y3M8HYC592"
  };

const App = initializeApp(FirebaseConfig);
const Analytics = getAnalytics(App);
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
            .catch((error) => {
                console.error("Error sending email link:", error);
                MessageDiv.innerHTML = `Error: ${error.message}`;
            });
    } else {
        MessageDiv.innerHTML = 'This email is not allowed';
    }
});

if (isSignInWithEmailLink(Auth, window.location.href)) {
    let email = window.localStorage.getItem('ClientEmail');
    if (email && (email.endsWith('@hsestudents.org') || email.endsWith('@hse.k12.in.us'))) {
        signInWithEmailLink(Auth, email, window.location.href)
            .then((result) => {
                MessageDiv.innerHTML = `Successfully signed in as ${result.user.email}, redirecting to shop...`;
                return result.user.getIdToken();
            })
            .then((token) => {
                return fetch('/sessionLogin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ token })
                });
            })
            .then((response) => {
                if (response.ok) {
                    setTimeout(() => {
                        window.location.href = "../shop";
                    }, 3000);
                } else {
                    throw new Error('Failed to create session on server.');
                }
            })
            .catch((error) => {
                console.error("Error signing in with email link:", error);
                MessageDiv.innerHTML = `Error: ${error.message}`;
            });
    } else if (email) {
        MessageDiv.innerHTML = 'This email is not allowed';
    }
}

onAuthStateChanged(Auth, (user) => {
    if (user) {
        user.getIdToken().then((idToken) => {
        console.log("ID Token:", idToken);
        });
        console.log('User is signed in:', user.email);
    } else {
        console.log('No user is signed in.');
    }
});