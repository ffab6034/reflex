// // TODO: Replace with your Firebase project config
// const firebaseConfig = {
//   apiKey: "AIzaSyCpZUZ_V-m1i71hB58T3QHKcapL_qs_49M",
//   authDomain: "reflex-tap-7815f.firebaseapp.com",
//   projectId: "reflex-tap-7815f",
//   storageBucket: "reflex-tap-7815f.firebasestorage.app",
//   messagingSenderId: "833157218846",
//   appId: "1:833157218846:web:77bbf1c73b299004a1e40f",
//   measurementId: "G-ZDHDZJ7J0B"
// };

// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

// const loginForm = document.getElementById('loginForm');
// const messageDiv = document.getElementById('message');

// loginForm.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const name = document.getElementById('name').value.trim();
//     const phone = document.getElementById('phone').value.trim();

//     try {
//         // Check if phone already exists
//         const query = await db.collection('logins').where('phone', '==', phone).limit(1).get();
//         let userId;
//         if (!query.empty) {
//             // Use existing account
//             userId = query.docs[0].id;
//             await db.collection('logins').doc(userId).update({ name });
//         } else {
//             // Create new account
//             const docRef = await db.collection('logins').add({
//                 name,
//                 phone,
//                 createdAt: firebase.firestore.FieldValue.serverTimestamp()
//             });
//             userId = docRef.id;
//         }
//         // Store userId in localStorage for later use
//         localStorage.setItem('userId', userId);
//         messageDiv.style.color = '#38a169';
//         messageDiv.textContent = 'Login successful!';
//         loginForm.reset();
//         setTimeout(() => {
//             window.location.href = 'home.html';
//         }, 800);
//     } catch (err) {
//         messageDiv.style.color = '#e53e3e';
//         messageDiv.textContent = 'Error logging in. Try again.';
//     }
// });




// Firebase Configuration
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

    if (!phone.match(/^\d{10,}$/)) {
        messageDiv.style.color = "#e53e3e";
        messageDiv.textContent = "Phone must be 10+ digits.";
        return;
    }

    try {
        // Check if phone exists
        const query = await db.collection('logins').where('phone', '==', phone).limit(1).get();
        let userId;

        if (!query.empty) {
            // Existing user: Update name (keep balance)
            userId = query.docs[0].id;
            await db.collection('logins').doc(userId).update({ name });
        } else {
            // New user: Set balance = 0
            const docRef = await db.collection('logins').add({
                name,
                phone,
                balance: 0, // Initialize balance
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            userId = docRef.id;
        }

        localStorage.setItem('userId', userId);
        messageDiv.style.color = "#38a169";
        messageDiv.textContent = "Login successful! Redirecting...";
        setTimeout(() => window.location.href = "home.html", 1000);
    } catch (err) {
        messageDiv.style.color = "#e53e3e";
        messageDiv.textContent = "Error logging in. Try again.";
        console.error(err);
    }
});