// === Firebase Configuration ===
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

// === Deposit Plan Click Handler ===
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
      // Disable UI
      card.style.opacity = '0.6';
      card.style.pointerEvents = 'none';

      // Firestore transaction
      const userRef = db.collection('logins').doc(userId);
      const depositId = Date.now().toString();

      await db.runTransaction(async (transaction) => {
        transaction.update(userRef, {
          balance: firebase.firestore.FieldValue.increment(amount)
        });

        transaction.set(db.collection('deposits').doc(depositId), {
          userId,
          amount,
          plan,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: "completed"
        });
      });

      alert(`Success! ₹${amount.toFixed(2)} added to your balance.`);
      updateBalanceDisplay();
      fetchProfile(); // Refresh deposit history

    } catch (err) {
      console.error("Deposit error:", err);
      alert(err.message || "Deposit failed. Please try again.");
    } finally {
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
    }
  });
});

// === Navigation & Screen Toggling ===
function showScreen(screen) {
  document.getElementById('screen-home').style.display = screen === 'home' ? '' : 'none';
  document.getElementById('screen-deposit').style.display = screen === 'deposit' ? '' : 'none';
  document.getElementById('screen-profile').style.display = screen === 'profile' ? '' : 'none';

  // Navbar active class
  document.getElementById('nav-home').classList.toggle('active', screen === 'home');
  document.getElementById('nav-deposit').classList.toggle('active', screen === 'deposit');
  document.getElementById('nav-profile').classList.toggle('active', screen === 'profile');

  // Auto load data
  if (screen === 'deposit') updateBalanceDisplay();
  if (screen === 'profile') fetchProfile();
}

// === Update Balance in UI ===
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

// === Load Profile Info + Deposit History ===
async function fetchProfile() {
  if (!userId) {
    document.getElementById('profile-name').textContent = "Not logged in";
    return;
  }

  try {
    const userDoc = await db.collection('logins').doc(userId).get();

    if (!userDoc.exists) throw new Error("User not found");

    const data = userDoc.data();
    document.getElementById('profile-name').textContent = data.name || data.username || "Anonymous";
    document.getElementById('profile-phone').textContent = data.phone || "No phone";
    document.getElementById('profile-balance').textContent = `₹${data.balance || 0}`;

    // Optional: Load deposit history (extend here)

  } catch (err) {
    console.error("Error loading profile:", err);
    document.getElementById('profile-name').textContent = "Error loading name";
    document.getElementById('profile-phone').textContent = "";
    document.getElementById('profile-balance').textContent = "₹0";
  }
}

// === Game Tabs Click → Go to Lobby ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const gameType = tab.getAttribute('data-game');
    window.location.href = `lobby.html?gameType=${gameType}`;
  });
});

// === Init App ===
if (userId) {
  updateBalanceDisplay();
  fetchProfile();
} else {
  window.location.href = 'index.html'; // force login
}
