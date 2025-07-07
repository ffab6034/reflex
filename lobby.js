// TODO: Use your actual Firebase config
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
const gameType = urlParams.get('gameType') || 'tab';

document.getElementById('lobby-title').textContent = 
    `Lobby - ${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game`;

const userId = 'user_' + Math.random().toString(36).substr(2, 9); // Replace with real user ID in production
let joinTimers = {};

async function createRoomsIfNeeded() {
    const roomsRef = db.collection('games').doc(gameType).collection('rooms');
    const snap = await roomsRef.where('status', '==', 'waiting').get();
    const waitingRooms = snap.docs;
    // Create new rooms if less than 10 waiting rooms
    for (let i = waitingRooms.length; i < 10; i++) {
        await roomsRef.add({
            players: [],
            status: 'waiting',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            maxPlayers: 10 // default, can be changed by first joiner
        });
    }
    // Do NOT delete extra rooms here, just keep at least 10 open
}

async function fetchRooms() {
    const roomsRef = db.collection('games').doc(gameType).collection('rooms');
    // Firestore requires an index for compound queries, so use only orderBy if possible
    const snap = await roomsRef.orderBy('createdAt', 'desc').limit(10).get();
    let rooms = [];
    snap.forEach(doc => {
        // Only show waiting rooms
        const data = doc.data();
        if (data.status === 'waiting') {
            rooms.push({ id: doc.id, ...data });
        }
    });
    renderRooms(rooms);
}

function renderRooms(rooms) {
    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = '';
    rooms.forEach(room => {
        const players = room.players || [];
        const status = room.status || 'waiting';
        const maxPlayers = room.maxPlayers || 10;
        const canJoin = status === 'waiting' && players.length < maxPlayers && !players.includes(userId);

        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="room-info">
                <span class="room-id">Room ID: ${room.id}</span>
                <span class="room-status">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <div class="room-players">Players: ${players.length}/${maxPlayers}</div>
            ${canJoin ? `<button class="join-btn" data-room="${room.id}">Join Room</button>` : ''}
        `;
        roomsList.appendChild(card);
    });

    document.querySelectorAll('.join-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const roomId = btn.getAttribute('data-room');
            await joinRoom(roomId);
        };
    });
}

async function joinRoom(roomId) {
    const roomRef = db.collection('games').doc(gameType).collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) return;

    const room = roomSnap.data();
    let players = room.players || [];
    let maxPlayers = room.maxPlayers || 10;

    if (players.length >= maxPlayers || players.includes(userId)) return;

    // If first player, let them choose maxPlayers (2-10)
    if (players.length === 0) {
        let chosen = prompt("How many players for this room? (2-10)", "10");
        let chosenNum = parseInt(chosen, 10);
        if (isNaN(chosenNum) || chosenNum < 2 || chosenNum > 10) chosenNum = 10;
        maxPlayers = chosenNum;
        await roomRef.update({ maxPlayers });
    }

    players.push(userId);
    await roomRef.update({ players });

    // Start timer if not started
    if (!room.timerStarted) {
        await roomRef.update({ timerStarted: true, timerStartAt: firebase.firestore.FieldValue.serverTimestamp() });
    }

    listenRoom(roomId);
}

function listenRoom(roomId) {
    const roomRef = db.collection('games').doc(gameType).collection('rooms').doc(roomId);
    const unsub = roomRef.onSnapshot(async doc => {
        const data = doc.data();
        if (!data) return;
        const maxPlayers = data.maxPlayers || 10;
        // Start if room is full or timer hits 10s
        if (data.players && data.players.length >= maxPlayers && data.status !== 'started') {
            await roomRef.update({ status: 'started' });
        }
        if (data.status === 'started') {
            // Remove this room and create a new waiting room to keep 10 open
            await roomRef.delete();
            await createRoomsIfNeeded();
            // Redirect to game screen
            let gamePage = 'game1.html';
            if (gameType === 'number') gamePage = 'game2.html';
            if (gameType === 'emoji') gamePage = 'game3.html';
            window.location.href = gamePage + '?roomId=' + doc.id;
            unsub();
        } else if (data.timerStarted && data.status !== 'started') {
            // Check timer
            const startAt = data.timerStartAt ? data.timerStartAt.toDate() : null;
            if (startAt) {
                const now = new Date();
                const elapsed = (now - startAt) / 1000;
                if (elapsed >= 10) {
                    await roomRef.update({ status: 'started' });
                } else {
                    document.getElementById('lobby-message').textContent =
                        `Game starts in ${Math.ceil(10 - elapsed)}s or when room is full.`;
                }
            }
        }
    });
}

async function initLobby() {
    await createRoomsIfNeeded();
    await fetchRooms();
    setInterval(async () => {
        await createRoomsIfNeeded();
        await fetchRooms();
    }, 2000);
}

initLobby();
