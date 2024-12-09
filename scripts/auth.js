import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
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
const Analytics = getAnalytics(App)
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
                MessageDiv.innerHTML = `Successfully signed in as ${result.user.email}, redirecting to shop`;
                setTimeout(() => {
                    window.location.href = "../shop";
                }, 5000);
            })
            .catch((error) => {
                console.error("Error signing in with email link:", error);
                MessageDiv.innerHTML = `Error: ${error.message}`;
            });
    } else if (email) {
        MessageDiv.innerHTML = 'This email is not allowed';
    }
}