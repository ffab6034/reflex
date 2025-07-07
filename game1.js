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
    // Save reaction time if not already saved
    const gameDoc = await gameRef.get();
    const results = (gameDoc.exists && gameDoc.data().results) || {};
    if (!results[userId]) {
        await gameRef.set({
            [`results.${userId}`]: reactionTime
        }, { merge: true });
    }
    showResultsDialog();
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

function showResultsDialog() {
    // Wait for all players or timeout, then fetch and show leaderboard
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '0';
    dialog.style.left = '0';
    dialog.style.width = '100vw';
    dialog.style.height = '100vh';
    dialog.style.background = 'rgba(0,0,0,0.4)';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.innerHTML = `<div style="background:#fff;padding:2em 1.5em;border-radius:16px;min-width:280px;text-align:center;">
        <div id="leaderboard-content">Waiting for all players...</div>
    </div>`;
    document.body.appendChild(dialog);

    // Poll for results until all players have tapped or game is finished
    let interval = setInterval(async () => {
        const roomSnap = await roomRef.get();
        const players = (roomSnap.exists && roomSnap.data().players) || [];
        const gameSnap = await gameRef.get();
        const results = (gameSnap.exists && gameSnap.data().results) || {};
        const finished = gameSnap.exists && gameSnap.data().finished;
        const allTapped = players.every(uid => results[uid]);
        if (allTapped || finished) {
            clearInterval(interval);
            // Fetch player names
            let userIds = players;
            if (userIds.length === 0) userIds = Object.keys(results);
            db.collection('logins').where(firebase.firestore.FieldPath.documentId(), 'in', userIds.slice(0,10)).get()
                .then(snapshot => {
                    let nameMap = {};
                    snapshot.forEach(doc => {
                        nameMap[doc.id] = doc.data().name || doc.id;
                    });
                    let entries = Object.entries(results).filter(([uid]) => userIds.includes(uid));
                    entries.sort((a, b) => a[1] - b[1]);
                    let winner = entries[0];
                    let html = `<b>Game Over!</b><br><br>`;
                    html += `<div style="font-size:1.1em;font-weight:bold;color:#38a169;">🏆 Winner: ${nameMap[winner[0]] || winner[0]} (${winner[1]} ms)</div><br>`;
                    html += `<table style="margin:0 auto;"><tr><th>Rank</th><th>Name</th><th>Time (ms)</th></tr>`;
                    entries.forEach(([uid, time], idx) => {
                        html += `<tr${uid === userId ? ' style="font-weight:bold;color:#764ba2;"' : ''}><td>${idx+1}</td><td>${nameMap[uid] || uid}</td><td>${time}</td></tr>`;
                    });
                    html += `</table><br>`;
                    html += `<button id="back-lobby-btn" style="padding:0.5em 1.2em;border-radius:8px;background:#764ba2;color:#fff;font-weight:bold;border:none;cursor:pointer;">Back to Lobby (<span id="back-timer">5</span>s)</button>`;
                    document.getElementById('leaderboard-content').innerHTML = html;
                    let timer = 5;
                    const t = setInterval(() => {
                        timer--;
                        document.getElementById('back-timer').textContent = timer;
                        if (timer <= 0) {
                            clearInterval(t);
                            window.location.href = "home.html";
                        }
                    }, 1000);
                    document.getElementById('back-lobby-btn').onclick = () => window.location.href = "home.html";
                });
        }
    }, 700);
}

function showResults(results) {
    const msgDiv = document.getElementById('game-message');
    if (!results) {
        msgDiv.textContent = "Game Over!";
        return;
    }
    // Fetch player names from Firestore logins collection
    const userIds = Object.keys(results);
    db.collection('logins').where(firebase.firestore.FieldPath.documentId(), 'in', userIds.slice(0,10)).get()
        .then(snapshot => {
            let nameMap = {};
            snapshot.forEach(doc => {
                nameMap[doc.id] = doc.data().name || doc.id;
            });
            let entries = Object.entries(results);
            entries.sort((a, b) => a[1] - b[1]);
            let winner = entries[0];
            let html = `<b>Game Over!</b><br><br>`;
            html += `<div style="font-size:1.1em;font-weight:bold;color:#38a169;">🏆 Winner: ${nameMap[winner[0]] || winner[0]} (${winner[1]} ms)</div><br>`;
            html += `<table style="margin:0 auto;"><tr><th>Rank</th><th>Name</th><th>Time (ms)</th></tr>`;
            entries.forEach(([uid, time], idx) => {
                html += `<tr${uid === userId ? ' style="font-weight:bold;color:#764ba2;"' : ''}><td>${idx+1}</td><td>${nameMap[uid] || uid}</td><td>${time}</td></tr>`;
            });
            html += `</table><br>`;
            html += `<button id="back-lobby-btn" style="padding:0.5em 1.2em;border-radius:8px;background:#764ba2;color:#fff;font-weight:bold;border:none;cursor:pointer;">Back to Lobby (<span id="back-timer">5</span>s)</button>`;
            msgDiv.innerHTML = html;
            let timer = 5;
            const interval = setInterval(() => {
                timer--;
                document.getElementById('back-timer').textContent = timer;
                if (timer <= 0) {
                    clearInterval(interval);
                    window.location.href = "home.html";
                }
            }, 1000);
            document.getElementById('back-lobby-btn').onclick = () => window.location.href = "home.html";
        });
}

setupGame();
