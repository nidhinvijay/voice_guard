// core/static/core/js/realtime_call.js
import { db } from './firebase-init.js';
import { ref, set, get, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
    setupCall();
    
    const callDocRef = ref(db, 'calls');
    const newCallRef = push(callDocRef);
    const callId = newCallRef.key;

    pc.onicecandidate = event => {
        event.candidate && set(push(ref(db, `calls/${callId}/offerCandidates`)), event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
    await set(newCallRef, { offer });

    callIdInput.value = callId;
    document.getElementById('controls').innerHTML = `<p class="alert alert-info">Share this call ID to invite someone: <strong>${callId}</strong></p>`;

    onValue(ref(db, `calls/${callId}/answer`), (snapshot) => {
        if (snapshot.exists() && !pc.currentRemoteDescription) {
            pc.setRemoteDescription(new RTCSessionDescription(snapshot.val()));
        }
    });

    onValue(ref(db, `calls/${callId}/answerCandidates`), (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const candidate = new RTCIceCandidate(childSnapshot.val());
            pc.addIceCandidate(candidate);
        });
    });
};

joinBtn.onclick = async () => {
    const callId = callIdInput.value;
    if (!callId) return alert('Please enter a Call ID.');

    setupCall();
    const callRef = ref(db, `calls/${callId}`);

    pc.onicecandidate = event => {
        event.candidate && set(push(ref(db, `calls/${callId}/answerCandidates`)), event.candidate.toJSON());
    };

    const callSnapshot = await get(callRef);
    if (callSnapshot.exists()) {
        await pc.setRemoteDescription(new RTCSessionDescription(callSnapshot.val().offer));
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await set(ref(db, `calls/${callId}/answer`), answer);

        onValue(ref(db, `calls/${callId}/offerCandidates`), (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const candidate = new RTCIceCandidate(childSnapshot.val());
                pc.addIceCandidate(candidate);
            });
        });

        document.getElementById('controls').innerHTML = `<p class="alert alert-success">Successfully joined call!</p>`;
    } else {
        alert('Call ID not found.');
    }
};

async function setupCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    localVideo.srcObject = localStream;

    pc = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    // THIS IS THE FIX: Directly assign the incoming stream to the remote video element.
    pc.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };
    
    setupModeration();
}

function setupModeration() {
    // This logic remains the same
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
            const transcriptText = data.is_final ? data.transcript : `(Speaking: ${data.transcript})`;
            localTranscriptDiv.textContent = transcriptText;
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