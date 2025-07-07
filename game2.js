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

const roomRef = db.collection('games').doc('number').collection('rooms').doc(roomId);
const gameRef = roomRef.collection('game').doc('state');

let startTime = null;
let clicked = false;

async function setupGame() {
    await db.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) {
            const target = Math.floor(10 + Math.random() * 90);
            let grid = [];
            let targetIndex = Math.floor(Math.random() * 16);
            for (let i = 0; i < 16; i++) {
                grid.push(i === targetIndex ? target : Math.floor(10 + Math.random() * 90));
            }
            const now = firebase.firestore.Timestamp.now();
            transaction.set(gameRef, {
                target,
                grid,
                targetIndex,
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
        document.getElementById('target-number').textContent = data.target;
        renderGrid(data.grid, data.targetIndex);
        if (!clicked) {
            startCountdown(startTime);
        }
        if (data.finished) {
            document.getElementById('game-message').textContent = "Game Over!";
        }
    });
}

function renderGrid(gridArr, targetIndex) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const btn = document.createElement('button');
        btn.className = 'grid-btn' + (i === targetIndex ? ' target' : '');
        btn.textContent = gridArr[i];
        btn.disabled = clicked;
        btn.onclick = () => handleClick(i, targetIndex);
        grid.appendChild(btn);
    }
}

async function handleClick(i, targetIndex) {
    if (clicked || i !== targetIndex) return;
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

setupGame();
