// const firebaseConfig = {
//     apiKey: "AIzaSyCpZUZ_V-m1i71hB58T3QHKcapL_qs_49M",
//     authDomain: "reflex-tap-7815f.firebaseapp.com",
//     projectId: "reflex-tap-7815f",
//     storageBucket: "reflex-tap-7815f.firebasestorage.app",
//     messagingSenderId: "833157218846",
//     appId: "1:833157218846:web:77bbf1c73b299004a1e40f",
//     measurementId: "G-ZDHDZJ7J0B"
// };

// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

// const userId = localStorage.getItem('userId');

// document.querySelectorAll('.plan-card').forEach(card => {
//     card.addEventListener('click', async () => {
//         if (!userId) {
//             alert('Please log in to make a deposit.');
//             window.location.href = 'index.html';
//             return;
//         }

//         const amount = parseInt(card.getAttribute('data-amount'), 10);
//         const plan = card.getAttribute('data-plan');

//         try {
//             card.style.opacity = '0.6';
//             card.style.pointerEvents = 'none';
            
//             await db.collection('deposits').add({
//                 userId: userId,
//                 amount: amount,
//                 plan: plan,
//                 createdAt: firebase.firestore.FieldValue.serverTimestamp()
//             });

//             alert(`Successfully deposited ₹${amount} (${plan} Plan)!`);
//             loadProfile();
//         } catch (err) {
//             console.error('Error saving deposit:', err);
//             alert('Error processing deposit. Please try again.');
//         } finally {
//             card.style.opacity = '1';
//             card.style.pointerEvents = 'auto';
//         }
//     });
// });

// document.querySelectorAll('.tab').forEach(tab => {
//     tab.addEventListener('click', () => {
//         const gameType = tab.getAttribute('data-game');
//         window.location.href = `lobby.html?gameType=${gameType}`;
//     });
// });

// async function loadProfile() {
//     if (!userId) return;
//     const profileSection = document.getElementById('profile-section');
//     try {
//         const query = await db.collection('deposits')
//             .where('userId', '==', userId)
//             .orderBy('createdAt', 'desc')
//             .limit(10)
//             .get();
        
//         profileSection.innerHTML = '';
//         if (query.empty) {
//             profileSection.innerHTML = '<p>No deposits yet.</p>';
//             return;
//         }

//         const ul = document.createElement('ul');
//         ul.style.listStyle = 'none';
//         ul.style.padding = '0';
//         query.forEach(doc => {
//             const data = doc.data();
//             const li = document.createElement('li');
//             li.style.marginBottom = '0.5rem';
//             li.textContent = `Deposited ₹${data.amount} (${data.plan}) on ${data.createdAt ? data.createdAt.toDate().toLocaleString() : 'Unknown date'}`;
//             ul.appendChild(li);
//         });
//         profileSection.appendChild(ul);
//     } catch (err) {
//         console.error('Error loading deposits:', err);
//         profileSection.innerHTML = '<p>Error loading deposit history.</p>';
//     }
// }

// if (userId) loadProfile();




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

// --- Deposit Logic ---
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
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';

            // 1. Get current balance
            const userRef = db.collection('logins').doc(userId);
            const userDoc = await userRef.get();
            const currentBalance = userDoc.data().balance || 0;

            // 2. Calculate new balance
            const newBalance = currentBalance + amount;

            // 3. Update Firestore (balance + deposit history)
            await db.runTransaction(async (transaction) => {
                transaction.update(userRef, { balance: newBalance });
                transaction.set(db.collection('deposits').doc(), {
                    userId,
                    amount,
                    plan,
                    newBalance,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            // 4. Show success message
            alert(`₹${amount} added! New balance: ₹${newBalance}`);
            updateBalanceDisplay(); // Refresh UI
            loadProfile(); // Update deposit history
        } catch (err) {
            alert("Deposit failed. Try again.");
            console.error(err);
        } finally {
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
    if (!userId) return;
    const profileInfo = document.getElementById('profile-info');
    try {
        const userDoc = await db.collection('logins').doc(userId).get();
        const data = userDoc.data();
        profileInfo.innerHTML = `
            <b>Name:</b> ${data.name}<br>
            <b>Phone:</b> ${data.phone}<br>
            <b>Balance:</b> ₹${data.balance || 0}
        `;
    } catch (err) {
        profileInfo.textContent = "Error loading profile.";
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