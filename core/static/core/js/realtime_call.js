// core/static/core/js/realtime_call.js
import { auth, db } from './firebase-init.js';
import { ref, set, get, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const servers = {
    iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const callIdInput = document.getElementById('callIdInput');
const localTranscriptDiv = document.getElementById('local-transcript');
const alertsContainer = document.getElementById('alerts-container');

let pc;
let localStream;
let moderationSocket;

// --- Main Functions ---

createBtn.onclick = async () => {
    await setupCall();
    const callRef = ref(db, 'calls/' + pc.localDescription.sdp.slice(-10)); // Simple unique ID
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    await set(ref(db, `calls/${callRef.key}`), { offer: { sdp: offer.sdp, type: offer.type } });
    
    callIdInput.value = callRef.key;
    statusDiv.textContent = `Call ID: ${callRef.key}. Waiting for another user...`;

    // Listen for the answer from the other user
    onValue(ref(db, `calls/${callRef.key}/answer`), (snapshot) => {
        if (snapshot.exists()) {
            pc.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
        }
    });

    // Listen for ICE candidates from the other user
    onValue(ref(db, `calls/${callRef.key}/iceCandidates/callee`), (snapshot) => {
        snapshot.forEach(childSnapshot => {
            pc.addIceCandidate(new RTCIceCandidate(childSnapshot.val()));
        });
    });
};

joinBtn.onclick = async () => {
    const callId = callIdInput.value;
    if (!callId) return alert('Please enter a Call ID.');
    
    await setupCall();
    const callRef = ref(db, `calls/${callId}`);
    const offerSnapshot = await get(callRef);

    if (offerSnapshot.exists()) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerSnapshot.val().offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await set(ref(db, `${callRef.key}/answer`), { sdp: answer.sdp, type: answer.type });

        // Listen for ICE candidates from the creator of the call
        onValue(ref(db, `${callRef.key}/iceCandidates/caller`), (snapshot) => {
            snapshot.forEach(childSnapshot => {
                pc.addIceCandidate(new RTCIceCandidate(childSnapshot.val()));
            });
        });
    }
};

async function setupCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();
    
    localVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;

    pc = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
    };

    pc.onicecandidate = event => {
        if (event.candidate) {
            const path = callIdInput.value ? `calls/${callIdInput.value}/iceCandidates/callee` : `calls/${pc.localDescription.sdp.slice(-10)}/iceCandidates/caller`;
            set(ref(db, `${path}/${event.candidate.sdpMid}`), event.candidate.toJSON());
        }
    };
    
    setupModeration();
}

function setupModeration() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    moderationSocket = new WebSocket(`${protocol}://${window.location.host}/ws/realtime/`);

    const mediaRecorder = new MediaRecorder(localStream, { mimeType: 'audio/webm; codecs=opus' });
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0 && moderationSocket.readyState === WebSocket.OPEN) {
            moderationSocket.send(event.data);
        }
    };
    mediaRecorder.start(250);

    moderationSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
            localTranscriptDiv.textContent = data.transcript;
        } else if (data.type === 'moderation') {
            handleModeration(data.feedback);
        }
    };
}

function handleModeration(feedback) {
    if (feedback.status === 'offensive') {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger';
        alertElement.innerHTML = `<strong>Original:</strong> "${feedback.original_text}"<br><strong>Suggestion:</strong> ${feedback.suggestion}`;
        alertsContainer.prepend(alertElement);
    }
}