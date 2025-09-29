import { db } from './firebase-init.js';
import { ref, set, get, onValue, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302'] }] };
const pc = new RTCPeerConnection(servers);
let localStream = null;
let moderationSocket = null;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const callIdInput = document.getElementById('callIdInput');
const languageSelect = document.getElementById('language-select');
const localTranscriptDiv = document.getElementById('local-transcript');
const alertsContainer = document.getElementById('alerts-container');
const initialControls = document.getElementById('initial-controls');
const callInterface = document.getElementById('call-interface');
const callStatus = document.getElementById('call-status');

createBtn.onclick = async () => {
    const callDocRef = ref(db, 'calls');
    const newCallRef = push(callDocRef);
    const callId = newCallRef.key;
    
    await setupCall(callId);

    pc.onicecandidate = e => e.candidate && set(push(ref(db, `calls/${callId}/offerCandidates`)), e.candidate.toJSON());
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await set(newCallRef, { offer: { sdp: offer.sdp, type: offer.type } });

    callStatus.innerHTML = `<p class="alert alert-info">Share this Call ID: <strong>${callId}</strong></p>`;
    
    onValue(ref(db, `calls/${callId}/answer`), snap => snap.exists() && !pc.currentRemoteDescription && pc.setRemoteDescription(new RTCSessionDescription(snap.val())));
    onValue(ref(db, `calls/${callId}/answerCandidates`), snap => snap.forEach(child => pc.addIceCandidate(new RTCIceCandidate(child.val()))));
};

joinBtn.onclick = async () => {
    const callId = callIdInput.value;
    if (!callId) return alert('Please enter a Call ID.');
    await setupCall(callId);

    pc.onicecandidate = e => e.candidate && set(push(ref(db, `calls/${callId}/answerCandidates`)), e.candidate.toJSON());

    const callSnap = await get(ref(db, `calls/${callId}`));
    if (callSnap.exists()) {
        await pc.setRemoteDescription(new RTCSessionDescription(callSnap.val().offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await set(ref(db, `calls/${callId}/answer`), { sdp: answer.sdp, type: answer.type });

        onValue(ref(db, `calls/${callId}/offerCandidates`), snap => snap.forEach(child => pc.addIceCandidate(new RTCIceCandidate(child.val()))));
        callStatus.innerHTML = `<p class="alert alert-success">Successfully joined call!</p>`;
    } else {
        alert('Call ID not found.');
    }
};

async function setupCall(callId) {
    initialControls.style.display = 'none';
    callInterface.style.display = 'block';

    localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    localVideo.srcObject = localStream;
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.ontrack = event => remoteVideo.srcObject = event.streams[0];
    setupModeration(callId);
}

function setupModeration(callId) {
    const selectedLang = languageSelect.value;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws/realtime/${callId}/?language=${selectedLang}`;
    moderationSocket = new WebSocket(url);

    moderationSocket.onopen = () => {
        const mediaRecorder = new MediaRecorder(localStream, { mimeType: 'audio/webm; codecs=opus' });
        mediaRecorder.ondataavailable = e => e.data.size > 0 && moderationSocket.send(e.data);
        mediaRecorder.start(1000);
    };

    moderationSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
            localTranscriptDiv.textContent = data.is_final ? data.transcript : `(Speaking: ${data.transcript})`;
        } else if (data.type === 'moderation') {
            handleModeration(data.feedback);
        }
    };
}

function handleModeration(feedback) {
    if (feedback.status === 'offensive') {
        const alertEl = document.createElement('div');
        alertEl.className = 'alert alert-danger';
        alertEl.innerHTML = `<strong>Original:</strong> "${feedback.original_text}"<br><strong>Suggestion:</strong> ${feedback.suggestion}`;
        alertsContainer.prepend(alertEl);
    }
}