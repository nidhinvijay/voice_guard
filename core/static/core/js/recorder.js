// core/static/core/js/recorder.js

document.addEventListener('DOMContentLoaded', () => {
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    const audioFileInput = document.getElementById('audio-file-input');
    const form = document.getElementById('audio-form');

    let mediaRecorder;
    let audioChunks = [];

    // Recording functionality
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        recordBtn.addEventListener('click', () => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    audioChunks = [];

                    mediaRecorder.addEventListener('dataavailable', event => {
                        audioChunks.push(event.data);
                    });

                    mediaRecorder.addEventListener('stop', () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        // Create a File object from the Blob
                        const audioFile = new File([audioBlob], "recording.wav", {
                            type: "audio/wav"
                        });
                        
                        // Use a DataTransfer object to set the file input's files property
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(audioFile);
                        audioFileInput.files = dataTransfer.files;

                        // Enable the submit button now that we have a file
                        form.querySelector('button[type="submit"]').disabled = false;
                    });
                    
                    recordBtn.disabled = true;
                    stopBtn.disabled = false;
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                    alert('Error accessing microphone. Please ensure you have given permission.');
                });
        });

        stopBtn.addEventListener('click', () => {
            mediaRecorder.stop();
            recordBtn.disabled = false;
            stopBtn.disabled = true;
        });
    } else {
        console.error('getUserMedia not supported on your browser!');
        recordBtn.disabled = true;
    }
    
    // Show spinner on form submission
    form.addEventListener('submit', () => {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.classList.add('is-loading');
        submitButton.disabled = true;
    });
});