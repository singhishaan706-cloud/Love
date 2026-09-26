/* ============================================================
   SECRET PRIVATE CHAT ("HUMAARI BAATEIN")
   Real-Time Sync via Firebase + Local Preview Fallback
   ============================================================ */

// ============================================================
// 1. FIREBASE CONFIGURATION
// Dono ke devices ke beech LIVE chat sync karne ke liye:
// 1. console.firebase.google.com pe jaake free project banao
// 2. Realtime Database create karo (Test Mode me)
// 3. Wahan se mila config niche paste kardo!
// (Jab tak yeh khali hai, tab tak local preview mode chalega)
// ============================================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBB9-2RUs2dnL4GdaOqoKgkSW_3D2GUlQw",
    authDomain: "our-chat-f6708.firebaseapp.com",
    databaseURL: "https://our-chat-f6708-default-rtdb.firebaseio.com",
    projectId: "our-chat-f6708",
    storageBucket: "our-chat-f6708.firebasestorage.app",
    messagingSenderId: "506344995926",
    appId: "1:506344995926:web:5dd32f35cd6a5f3e058ff7"
};

// ============================================================
// 2. CHAT STATE & USER IDENTITY
// ============================================================
const ChatState = {
    currentUser: 'ishaan', // 'ishaan' | 'kittu'
    isFirebaseReady: false,
    dbRef: null,
    messages: [],
    isOpen: false,
    unreadCount: 0,
    soundEnabled: true,
};

// Available Users
const CHAT_USERS = {
    ishaan: {
        id: 'ishaan',
        name: 'Ishaan',
        tag: '👦 Ishaan',
        avatar: '👦',
        color: '#ff6b9d'
    },
    kittu: {
        id: 'kittu',
        name: 'Kittu',
        tag: '🌸 Kittu',
        avatar: '🌸',
        color: '#f8a5c2'
    }
};

// ============================================================
// 3. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initUserIdentity();
    initChatUI();
    initDatabase();
    checkStoryVisibility();
});

// Detect user from URL param (e.g. ?u=kittu) or LocalStorage
function initUserIdentity() {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('u') || urlParams.get('user');

    if (userParam && (userParam.toLowerCase() === 'kittu' || userParam.toLowerCase() === 'anwesha')) {
        ChatState.currentUser = 'kittu';
        localStorage.setItem('secret_chat_user', 'kittu');
    } else if (userParam && userParam.toLowerCase() === 'ishaan') {
        ChatState.currentUser = 'ishaan';
        localStorage.setItem('secret_chat_user', 'ishaan');
    } else {
        const saved = localStorage.getItem('secret_chat_user');
        if (saved && CHAT_USERS[saved]) {
            ChatState.currentUser = saved;
        } else {
            ChatState.currentUser = 'ishaan'; // Default
        }
    }
}

// Ensure the chat button only becomes prominent once story starts
function checkStoryVisibility() {
    const storyScreen = document.getElementById('story-screen');
    const chatToggleBtn = document.getElementById('secret-chat-toggle-btn');
    if (!chatToggleBtn) return;

    const observer = new MutationObserver(() => {
        if (storyScreen && !storyScreen.classList.contains('hidden')) {
            chatToggleBtn.classList.add('visible');
        }
    });

    if (storyScreen) {
        observer.observe(storyScreen, { attributes: true, attributeFilter: ['class'] });
        if (!storyScreen.classList.contains('hidden')) {
            chatToggleBtn.classList.add('visible');
        }
    }
}

// ============================================================
// 4. DATABASE INITIALIZATION (FIREBASE / LOCAL)
// ============================================================
function initDatabase() {
    // If projectId is present but databaseURL is omitted in the config snippet, auto-construct it
    if (!FIREBASE_CONFIG.databaseURL && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId.trim().length > 0) {
        FIREBASE_CONFIG.databaseURL = `https://${FIREBASE_CONFIG.projectId}-default-rtdb.firebaseio.com`;
    }

    const hasFirebase = Boolean(
        typeof firebase !== 'undefined' &&
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.apiKey.trim().length > 0 &&
        FIREBASE_CONFIG.databaseURL &&
        FIREBASE_CONFIG.databaseURL.trim().length > 0
    );

    if (hasFirebase) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            const db = firebase.database();
            ChatState.dbRef = db.ref('our_secret_chat');
            ChatState.isFirebaseReady = true;

            updateConnectionStatus(true);
            listenForFirebaseMessages();
            return;
        } catch (err) {
            console.warn('Firebase init error, fallback to local storage:', err);
        }
    }

    // Fallback: LocalStorage Mode
    ChatState.isFirebaseReady = false;
    updateConnectionStatus(false);
    loadLocalMessages();
}

function updateConnectionStatus(isLive) {
    const statusDot = document.getElementById('chat-status-dot');
    const statusText = document.getElementById('chat-status-text');
    if (!statusDot || !statusText) return;

    if (isLive) {
        statusDot.className = 'status-dot live';
        statusText.textContent = 'Dono phones me Live 🟢';
        statusText.title = 'Real-time sync active across both devices';
    } else {
        statusDot.className = 'status-dot preview';
        statusText.textContent = 'Sirf aapke phone par (Local) 🟡';
        statusText.title = 'Firebase connect hone ke baad dono ke phones me live messages aane lagenge.';
    }
}

// ============================================================
// 5. MESSAGE LISTENERS & SYNC
// ============================================================
function listenForFirebaseMessages() {
    if (!ChatState.dbRef) return;

    // Check if database has messages, otherwise render empty state
    ChatState.dbRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            renderAllMessages();
        }
    });

    ChatState.dbRef.limitToLast(100).on('child_added', (snapshot) => {
        const msg = snapshot.val();
        if (!msg) return;

        // Prevent duplicate appending
        if (!ChatState.messages.some(m => m.id === msg.id || (m.timestamp === msg.timestamp && m.sender === msg.sender && m.text === msg.text))) {
            ChatState.messages.push(msg);
            renderSingleMessage(msg);

            // Handle unread & notification chime
            if (!ChatState.isOpen && msg.sender !== ChatState.currentUser) {
                incrementUnread();
                playMessageChime();
            }
        }
    });
}

function loadLocalMessages() {
    try {
        const saved = localStorage.getItem('secret_chat_messages_local');
        if (saved) {
            ChatState.messages = JSON.parse(saved);
        } else {
            // Default warm starter messages
            ChatState.messages = [
                {
                    id: 'msg_welcome_1',
                    sender: 'ishaan',
                    text: 'Yeh humara private secret corner hai... ❤️ Jahan hum jab chahein ek doosre se dil ki baat kar sakte hain.',
                    timestamp: Date.now() - 3600000,
                },
                {
                    id: 'msg_welcome_2',
                    sender: 'ishaan',
                    text: 'Jab bhi tum yeh site kholo, mujhe ek message zaroor chhodna ✨',
                    timestamp: Date.now() - 1800000,
                }
            ];
            saveLocalMessages();
        }
    } catch (e) {
        ChatState.messages = [];
    }

    renderAllMessages();
}

function saveLocalMessages() {
    try {
        localStorage.setItem('secret_chat_messages_local', JSON.stringify(ChatState.messages));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
    }
}

// ============================================================
// 6. SENDING MESSAGES
// ============================================================
function sendMessage(text) {
    if (!text || !text.trim()) return;

    const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sender: ChatState.currentUser,
        text: text.trim(),
        timestamp: Date.now()
    };

    if (ChatState.isFirebaseReady && ChatState.dbRef) {
        ChatState.dbRef.push(newMsg).catch(err => {
            console.error('Firebase send error:', err);
            // Fallback save locally
            appendAndRenderLocalMessage(newMsg);
        });
    } else {
        appendAndRenderLocalMessage(newMsg);
    }
}

function appendAndRenderLocalMessage(msg) {
    ChatState.messages.push(msg);
    saveLocalMessages();
    renderSingleMessage(msg);
}

// Quick reaction sender
function sendQuickReaction(emoji) {
    sendMessage(emoji);
    burstChatReactionHearts(emoji);
}

// ============================================================
// 7. UI RENDERING & DOM INTERACTION
// ============================================================
function initChatUI() {
    const toggleBtn = document.getElementById('secret-chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const userToggleBtn = document.getElementById('chat-user-switch');
    const form = document.getElementById('chat-input-form');
    const input = document.getElementById('chat-input-text');
    const soundBtn = document.getElementById('chat-sound-btn');

    // Toggle open/close
    toggleBtn?.addEventListener('click', toggleChatModal);
    closeBtn?.addEventListener('click', toggleChatModal);

    // Switch identity (Ishaan <-> Kittu)
    userToggleBtn?.addEventListener('click', () => {
        ChatState.currentUser = ChatState.currentUser === 'ishaan' ? 'kittu' : 'ishaan';
        localStorage.setItem('secret_chat_user', ChatState.currentUser);
        updateUserUI();
        renderAllMessages(); // Re-render so left/right align with new sender
    });

    // Sound toggle
    soundBtn?.addEventListener('click', () => {
        ChatState.soundEnabled = !ChatState.soundEnabled;
        soundBtn.textContent = ChatState.soundEnabled ? '🔔' : '🔕';
        soundBtn.title = ChatState.soundEnabled ? 'Sound Enabled' : 'Sound Muted';
    });

    // Form submit
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value;
        if (text && text.trim()) {
            sendMessage(text);
            input.value = '';
            input.focus();
        }
    });

    // Quick reaction pills
    document.querySelectorAll('.reaction-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const reaction = btn.getAttribute('data-reaction');
            if (reaction) sendQuickReaction(reaction);
        });
    });

    updateUserUI();
}

function toggleChatModal() {
    const modal = document.getElementById('secret-chat-modal');
    const toggleBtn = document.getElementById('secret-chat-toggle-btn');
    if (!modal) return;

    ChatState.isOpen = !ChatState.isOpen;

    if (ChatState.isOpen) {
        modal.classList.add('open');
        toggleBtn?.classList.add('chat-active');
        clearUnread();
        scrollChatToBottom(true);
        setTimeout(() => {
            document.getElementById('chat-input-text')?.focus();
        }, 300);
    } else {
        modal.classList.remove('open');
        toggleBtn?.classList.remove('chat-active');
    }
}

function updateUserUI() {
    const label = document.getElementById('chat-user-label');
    const sublabel = document.getElementById('chat-user-subtext');
    const current = CHAT_USERS[ChatState.currentUser];

    if (label && current) {
        label.textContent = current.tag;
    }
    if (sublabel && current) {
        sublabel.textContent = ChatState.currentUser === 'ishaan' 
            ? 'Tum Ishaan banke likh rahe ho' 
            : 'Tum Kittu banke likh rahi ho ❤️';
    }
}

function formatChatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    if (isToday) {
        return `Today ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${timeStr}`;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${timeStr}`;
}

function renderSingleMessage(msg) {
    const list = document.getElementById('chat-messages-list');
    if (!list) return;

    const isMe = msg.sender === ChatState.currentUser;
    const senderInfo = CHAT_USERS[msg.sender] || { name: msg.sender, avatar: '✨' };

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg-row ${isMe ? 'msg-sent' : 'msg-received'}`;
    msgEl.setAttribute('data-id', msg.id || '');

    // Check if the message is only emojis
    const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(msg.text.trim()) && msg.text.trim().length <= 8;

    msgEl.innerHTML = `
        <div class="msg-bubble-wrapper">
            ${!isMe ? `<span class="msg-sender-name">${senderInfo.name}</span>` : ''}
            <div class="msg-bubble ${isEmojiOnly ? 'bubble-emoji-only' : ''}">
                <p class="msg-text">${escapeHTML(msg.text)}</p>
                <span class="msg-time">${formatChatTime(msg.timestamp)}</span>
            </div>
        </div>
    `;

    list.appendChild(msgEl);
    scrollChatToBottom();
}

function renderAllMessages() {
    const list = document.getElementById('chat-messages-list');
    if (!list) return;
    list.innerHTML = '';

    if (!ChatState.isFirebaseReady) {
        const banner = document.createElement('div');
        banner.className = 'chat-preview-banner';
        banner.innerHTML = `
            <span>⚠️ <strong>Local Mode:</strong> Yeh messages abhi sirf aapke device par hain. Dono ke beech live chat chalane ke liye Firebase connect karein.</span>
        `;
        list.appendChild(banner);
    }

    if (ChatState.messages.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'chat-empty-state';
        emptyDiv.innerHTML = `
            <span class="empty-icon">💌</span>
            <p>Abhi yahan koi naya message nahi hai...</p>
            <span>Pehla message bhejke baat shuru karo ❤️</span>
        `;
        list.appendChild(emptyDiv);
        return;
    }

    ChatState.messages.forEach(renderSingleMessage);
    scrollChatToBottom(true);
}

function scrollChatToBottom(immediate = false) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (immediate) {
        container.scrollTop = container.scrollHeight;
    } else {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// 8. UNREAD BADGE & AUDIO CHIME
// ============================================================
function incrementUnread() {
    ChatState.unreadCount++;
    const badge = document.getElementById('chat-unread-badge');
    if (badge) {
        badge.textContent = ChatState.unreadCount > 9 ? '9+' : ChatState.unreadCount;
        badge.classList.remove('hidden');
        badge.classList.add('pulse');
    }
}

function clearUnread() {
    ChatState.unreadCount = 0;
    const badge = document.getElementById('chat-unread-badge');
    if (badge) {
        badge.textContent = '0';
        badge.classList.add('hidden');
        badge.classList.remove('pulse');
    }
}

// Romantic chime synthesized with Web Audio API (gentle & soft)
function playMessageChime() {
    if (!ChatState.soundEnabled) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Two notes chime (E5 -> G#5)
        const notes = [
            { f: 659.25, time: 0, dur: 0.25 },
            { f: 830.61, time: 0.12, dur: 0.4 }
        ];

        notes.forEach(n => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.time);

            gain.gain.setValueAtTime(0.001, ctx.currentTime + n.time);
            gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + n.time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + n.time);
            osc.stop(ctx.currentTime + n.time + n.dur);
        });

        setTimeout(() => {
            ctx.close().catch(() => {});
        }, 1000);
    } catch (e) {
        // Audio policy or unsupported
    }
}

// Burst cute hearts inside the chat window when quick reaction tapped
function burstChatReactionHearts(emoji) {
    const container = document.getElementById('chat-reaction-fx');
    if (!container) return;

    for (let i = 0; i < 7; i++) {
        const span = document.createElement('span');
        span.className = 'chat-floating-heart';
        span.textContent = emoji || '❤️';
        span.style.left = (20 + Math.random() * 60) + '%';
        span.style.bottom = '80px';
        span.style.fontSize = (Math.random() * 1 + 1.2) + 'rem';
        span.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
        container.appendChild(span);
        setTimeout(() => span.remove(), 2500);
    }
}
