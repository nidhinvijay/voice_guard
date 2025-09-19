// core/static/core/js/realtime.js
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const transcriptContainer = document.getElementById('transcript-container');
const alertsContainer = document.getElementById('alerts-container');

let socket;
let mediaRecorder;

startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    transcriptContainer.innerHTML = '';
    alertsContainer.innerHTML = '';
    statusDiv.textContent = 'Status: Connecting...';

    socket = new WebSocket(`ws://${window.location.host}/ws/realtime/`);

    socket.onopen = () => {
        statusDiv.textContent = 'Status: Connected. Start speaking!';
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
            
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };
            mediaRecorder.start(250); // Send audio frequently
        }).catch(err => {
            console.error('Microphone Error:', err);
            statusDiv.textContent = 'Error: Could not access microphone.';
        });
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
            updateTranscriptUI(data.transcript, data.is_final);
        } else if (data.type === 'moderation') {
            updateModerationUI(data.feedback);
        }
    };

    socket.onclose = () => statusDiv.textContent = 'Status: Disconnected';
    socket.onerror = () => statusDiv.textContent = 'Status: Connection Error';
});

stopBtn.addEventListener('click', () => {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (mediaRecorder) mediaRecorder.stop();
    if (socket) socket.close();
});

let currentTranscriptElement = null;
function updateTranscriptUI(text, isFinal) {
    if (!currentTranscriptElement || isFinal) {
        currentTranscriptElement = document.createElement('p');
        transcriptContainer.appendChild(currentTranscriptElement);
    }
    currentTranscriptElement.textContent = text;
    if (isFinal) {
        currentTranscriptElement.classList.add('transcript-final');
        currentTranscriptElement = null;
    }
}

function updateModerationUI(result) {
    const alertsContainer = document.getElementById('alerts-container');
    
    // Find the correct transcript line using the text content
    const allTranscripts = transcriptContainer.querySelectorAll('p.transcript-final');
    let targetTranscript = null;
    for (let i = allTranscripts.length - 1; i >= 0; i--) {
        // Find the p tag that hasn't been moderated yet and matches the text
        if (allTranscripts[i].textContent.includes(result.original_text) && !allTranscripts[i].dataset.moderated) {
            targetTranscript = allTranscripts[i];
            break;
        }
    }
    if (!targetTranscript) return; // If we can't find the matching text, do nothing.

    // Mark this transcript as moderated so we don't select it again
    targetTranscript.dataset.moderated = 'true';

    if (result.status === 'offensive') {
        // 1. Change the color of the original transcript to red
        targetTranscript.classList.add('text-is-flagged');

        // 2. Create the separate alert below
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger';
        alertElement.innerHTML = `<strong>Original:</strong> "${result.original_text}"<br><strong>Suggestion:</strong> ${result.suggestion}`;
        alertsContainer.appendChild(alertElement);

    } else if (result.status === 'clean') {
        // 1. Change the color of the original transcript to green
        targetTranscript.classList.add('text-is-clean');

        // 2. Add the positive suggestion if it exists
        if (result.suggestion) {
            const suggestionSpan = document.createElement('span');
            suggestionSpan.className = 'text-success fst-italic';
            suggestionSpan.textContent = ` (${result.suggestion})`;
            targetTranscript.appendChild(suggestionSpan);
        }
    }
}