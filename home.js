


// Firebase Configuration (same as login.js)
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
const userId = localStorage.getItem('userId');

// // --- Deposit Logic ---
// document.querySelectorAll('.plan-card').forEach(card => {
//     card.addEventListener('click', async () => {
//         if (!userId) {
//             alert('Please log in first.');
//             window.location.href = 'index.html';
//             return;
//         }

//         const amount = parseInt(card.getAttribute('data-amount'), 10);
//         const plan = card.getAttribute('data-plan');

//         try {
//             card.style.opacity = '0.6';
//             card.style.pointerEvents = 'none';

//             // 1. Get current balance
//             const userRef = db.collection('logins').doc(userId);
//             const userDoc = await userRef.get();
//             const currentBalance = userDoc.data().balance || 0;

//             // 2. Calculate new balance
//             const newBalance = currentBalance + amount;

//             // 3. Update Firestore (balance + deposit history)
//             await db.runTransaction(async (transaction) => {
//                 transaction.update(userRef, { balance: newBalance });
//                 transaction.set(db.collection('deposits').doc(), {
//                     userId,
//                     amount,
//                     plan,
//                     newBalance,
//                     createdAt: firebase.firestore.FieldValue.serverTimestamp()
//                 });
//             });

//             // 4. Show success message
//             alert(`₹${amount} added! New balance: ₹${newBalance}`);
//             updateBalanceDisplay(); // Refresh UI
//             loadProfile(); // Update deposit history
//         } catch (err) {
//             alert("Deposit failed. Try again.");
//             console.error(err);
//         } finally {
//             card.style.opacity = '1';
//             card.style.pointerEvents = 'auto';
//         }
//     });
// });

document.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', async () => {
        if (!userId) {
            alert('Please log in first.');
            window.location.href = 'index.html';
            return;
        }

        const amount = parseInt(card.getAttribute('data-amount'), 10);
        const plan = card.getAttribute('data-plan');

        try {
            // Disable card during processing
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';

            // Firestore references
            const userRef = db.collection('logins').doc(userId);
            const depositId = Date.now().toString(); // Unique ID for deposit

            // Atomic transaction
            await db.runTransaction(async (transaction) => {
                // 1. Update balance (safely increment)
                transaction.update(userRef, { 
                    balance: firebase.firestore.FieldValue.increment(amount) 
                });

                // 2. Record deposit history
                transaction.set(db.collection('deposits').doc(depositId), {
                    userId,
                    amount,
                    plan,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: "completed"
                });
            });

            // Success feedback
            alert(`Success! ₹${amount.toFixed(2)} added to your balance.`);
            updateBalanceDisplay();
            // loadProfile();

        } catch (err) {
            console.error("Deposit error:", err);
            alert(err.message || "Deposit failed. Please try again.");
        } finally {
            // Re-enable card
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        }
    });
});

// --- UI Functions ---
function showScreen(screen) {
    document.getElementById('screen-home').style.display = screen === 'home' ? '' : 'none';
    document.getElementById('screen-deposit').style.display = screen === 'deposit' ? '' : 'none';
    document.getElementById('screen-profile').style.display = screen === 'profile' ? '' : 'none';
    
    // Update active tab
    document.getElementById('nav-home').classList.toggle('active', screen === 'home');
    document.getElementById('nav-deposit').classList.toggle('active', screen === 'deposit');
    document.getElementById('nav-profile').classList.toggle('active', screen === 'profile');

    // Load data when screen opens
    if (screen === 'deposit') updateBalanceDisplay();
    if (screen === 'profile') fetchProfile();
}

async function updateBalanceDisplay() {
    if (!userId) return;
    const balanceElement = document.getElementById('current-balance');
    try {
        const userDoc = await db.collection('logins').doc(userId).get();
        const balance = userDoc.data().balance || 0;
        balanceElement.textContent = `Current Balance: ₹${balance}`;
    } catch (err) {
        balanceElement.textContent = "Failed to load balance.";
    }
}



async function fetchProfile() {
    if (!userId) {
        console.error("No user ID found");
        document.getElementById('profile-name').textContent = "Not logged in";
        return;
    }

    try {
        // 1. Fetch user document
        const userDoc = await db.collection('logins').doc(userId).get();
        
        // Debug: Log the entire document
        console.log("User document:", userDoc.data());

        if (!userDoc.exists) {
            throw new Error("User document doesn't exist");
        }

        const userData = userDoc.data();
        
        // 2. Safely extract data with fallbacks
        const userName = userData.name || userData.username || "Anonymous";
        const userPhone = userData.phone || "No phone";
        const userBalance = userData.balance || 0;

        // 3. Update UI
        document.getElementById('profile-name').textContent = userName;
        document.getElementById('profile-phone').textContent = userPhone;
        document.getElementById('profile-balance').textContent = `₹${userBalance}`;

        // ... (rest of your deposit history code)

    } catch (err) {
        console.error("Full error details:", err);
        document.getElementById('profile-name').textContent = "Error loading name";
        document.getElementById('profile-phone').textContent = "";
        document.getElementById('profile-balance').textContent = "₹0";
    }
}

// Initialize
if (userId) {
    updateBalanceDisplay();
    fetchProfile();
} else {
    window.location.href = 'index.html'; // Redirect if not logged in
}


// ===== TAB NAVIGATION =====
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const gameType = tab.getAttribute('data-game');
        window.location.href = `lobby.html?gameType=${gameType}`;
    });
});