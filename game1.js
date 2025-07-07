// ...firebase config and init...
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

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
const userId = 'user_' + Math.random().toString(36).substr(2, 9); // Replace with real user ID

const roomRef = db.collection('games').doc('tab').collection('rooms').doc(roomId);
const gameRef = roomRef.collection('game').doc('state');

let startTime = null;
let clicked = false;

async function setupGame() {
    // Only one user (first) sets the red button and start time
    await db.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) {
            const redIndex = Math.floor(Math.random() * 16);
            const now = firebase.firestore.Timestamp.now();
            transaction.set(gameRef, {
                redIndex,
                startTime: now,
                results: {},
                finished: false
            });
        }
    });

    gameRef.onSnapshot(doc => {
        const data = doc.data();
        if (!data) return;
        startTime = data.startTime.toDate();
        renderGrid(data.redIndex);
        if (!clicked) {
            startCountdown(startTime);
        }
        if (data.finished) {
            showResults(data.results);
        }
    });
}

function renderGrid(redIndex) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const btn = document.createElement('button');
        btn.className = 'grid-btn' + (i === redIndex ? ' red' : '');
        btn.disabled = clicked;
        btn.onclick = () => handleClick(i, redIndex);
        grid.appendChild(btn);
    }
}

async function handleClick(i, redIndex) {
    if (clicked || i !== redIndex) return;
    clicked = true;
    const clickTime = new Date();
    const reactionTime = clickTime - startTime;
    document.getElementById('game-message').textContent = `Your reaction time: ${reactionTime} ms`;
    await gameRef.set({
        [`results.${userId}`]: reactionTime
    }, { merge: true });
}

function startCountdown(startTime) {
    const interval = setInterval(async () => {
        const now = new Date();
        const elapsed = (now - startTime) / 1000;
        if (elapsed >= 8) {
            clearInterval(interval);
            await gameRef.update({ finished: true });
        }
    }, 200);
}

function showResults(results) {
    const msgDiv = document.getElementById('game-message');
    if (!results) {
        msgDiv.textContent = "Game Over!";
        return;
    }
    let entries = Object.entries(results);
    entries.sort((a, b) => a[1] - b[1]);
    let winner = entries[0];
    let myTime = results[userId];
    let html = `<b>Game Over!</b><br>`;
    html += `Winner: ${winner[0]}<br>Reaction Time: ${winner[1]} ms<br><br>`;
    html += `All Players:<br>`;
    entries.forEach(([uid, time]) => {
        html += `${uid === userId ? "<b>You</b>" : uid}: ${time} ms<br>`;
    });
    msgDiv.innerHTML = html;
}

setupGame();
