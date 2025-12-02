let startButton, conversation, saveButton, userNameInput, membershipNumberInput, status, processSpeechButton, realtimeTranscript;
let userName = '';
let membershipNumber = '';
let voices = [];
let recognition;
let currentState = 'IDLE';

function init() {
    startButton = document.getElementById('startButton');
    conversation = document.getElementById('conversation');
    saveButton = document.getElementById('saveButton');
    userNameInput = document.getElementById('userName');
    membershipNumberInput = document.getElementById('membershipNumber');
    status = document.getElementById('status');
    processSpeechButton = document.getElementById('processSpeechButton');
    realtimeTranscript = document.getElementById('realtime-transcript');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = onRecognitionResult;
    recognition.onerror = onRecognitionError;

    speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
    };

    saveButton.addEventListener('click', onSaveButtonClick);
    startButton.addEventListener('click', onStartButtonClick);
    processSpeechButton.addEventListener('click', onProcessSpeechButtonClick);
}

document.addEventListener('DOMContentLoaded', init);

const conversationLogic = {
    'IDLE': {
        prompt: "Hello, I am your gym membership cancellation assistant. When you are ready, I will state my purpose.",
        responses: {
            'default': 'STATING_PURPOSE'
        }
    },
    'STATING_PURPOSE': {
        prompt: "Hello, I am calling to cancel my gym membership.",
        responses: {
            'default': 'WAITING_FOR_RESPONSE'
        }
    },
    'WAITING_FOR_RESPONSE': {
        prompt: "", // Agent waits for human response
        responses: {
            'PROVIDING_INFO': ['ok', 'okay', 'sure', 'alright'],
            'HANDLING_OBJECTIONS': ['why', 'offer', 'special'],
            'default': 'PROVIDING_INFO'
        }
    },
    'PROVIDING_INFO': {
        prompt: `My membership number is ${membershipNumber}. My name is ${userName}.`,
        responses: {
            'default': 'WAITING_FOR_RESPONSE_2'
        }
    },
    'WAITING_FOR_RESPONSE_2': {
        prompt: "",
        responses: {
            'cancelled': 'CONFIRMING_CANCELLATION',
            'default': 'CONFIRMING_CANCELLATION'
        }
    },
    'HANDLING_OBJECTIONS': {
        prompt: "I am not interested in any special offers at this time. Please proceed with the cancellation.",
        responses: {
            'default': 'WAITING_FOR_RESPONSE_2'
        }
    },
    'CONFIRMING_CANCELLATION': {
        prompt: "Thank you. Can you please confirm that the membership has been cancelled and that I will not be billed any further?",
        responses: {
            'ENDING_CALL': ['yes', 'confirmed', 'done'],
            'default': 'ENDING_CALL'
        }
    },
    'ENDING_CALL': {
        prompt: "Thank you for your assistance. Goodbye.",
        responses: {}
    }
};

/**
 * Updates the status display with a new message.
 * @param {string} message - The message to display.
 */
function updateStatus(message) {
    status.textContent = message;
}

/**
 * Speaks the given text using the browser's speech synthesis API.
 * It also updates the agent's status to "Speaking..." and "Idle" before and after.
 * @param {string} text - The text to speak.
 * @returns {Promise<void>} - A promise that resolves when the speech is finished.
 */
function speak(text) {
    updateStatus('Speaking...');
    return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Ensure voices are loaded
        if (voices.length === 0) {
            voices = window.speechSynthesis.getVoices();
        }

        utterance.voice = voices.find(voice => voice.name === 'Google US English');
        utterance.onend = () => {
            updateStatus('Idle');
            resolve();
        };
        utterance.onerror = (event) => {
            updateStatus(`Error speaking: ${event.error}`);
            reject(event.error);
        };
        speechSynthesis.speak(utterance);
        addMessage('Agent', text);
    });
}

/**
 * Adds a message to the conversation log.
 * @param {string} sender - The sender of the message (e.g., "Agent", "Human").
 * @param {string} message - The message to add.
 */
function addMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    conversation.appendChild(messageElement);
    conversation.scrollTop = conversation.scrollHeight;
}

/**
 * Manages the conversation flow by taking the agent to a new state.
 * It speaks the prompt for the new state and then starts listening for a response.
 * @param {string} state - The state to transition to.
 */
async function handleState(state) {
    currentState = state;
    const stateLogic = conversationLogic[state];
    
    if (stateLogic.prompt) {
        await speak(stateLogic.prompt);
    }

    if (Object.keys(stateLogic.responses).length > 0) {
        updateStatus('Listening...');
        realtimeTranscript.textContent = '';
        recognition.start();
        processSpeechButton.disabled = false;
    } else {
        updateStatus('Call Ended');
        console.log("End of conversation.");
    }
}

function onRecognitionResult(event) {
    let transcript = '';
    for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
    }
    realtimeTranscript.textContent = transcript;
}

/**
 * Processes the final transcript from the speech recognition.
 * It stops the recognition, adds the transcript to the conversation log,
 * and determines the next state based on keyword matching.
 * @param {string} transcript - The final transcript from the user.
 * @param {function} handleStateFn - The function to call to handle the next state.
 */
function processTranscript(transcript, handleStateFn = handleState) {
    addMessage('Human', transcript);
    recognition.stop();
    processSpeechButton.disabled = true;
    realtimeTranscript.textContent = '';

    const stateLogic = conversationLogic[currentState];
    let nextState = stateLogic.responses['default']; // Default transition

    // Loop through the possible responses for the current state to find a keyword match.
    for (const state in stateLogic.responses) {
        // Get the keywords for the potential next state. This can be an array of words or just the state name itself.
        const keywords = Array.isArray(stateLogic.responses[state]) ? stateLogic.responses[state] : [state];
        // If the transcript includes any of the keywords, we've found our next state.
        if (keywords.some(keyword => transcript.includes(keyword))) {
            // If the response is defined as an array of keywords, the state name is the key.
            // Otherwise, the response is the state name itself.
            nextState = Array.isArray(stateLogic.responses[state]) ? state : stateLogic.responses[state];
            break;
        }
    }
    
    handleStateFn(nextState);
}

function onRecognitionError(event) {
    let errorMessage = `Speech recognition error: ${event.error}`;
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
    } else if (event.error === 'no-speech') {
        errorMessage = "No speech detected. Please try again.";
    }
    updateStatus(errorMessage);
    console.error(errorMessage);
    recognition.stop();
    processSpeechButton.disabled = true;
}

function onProcessSpeechButtonClick() {
    const currentTranscript = realtimeTranscript.textContent;
    if (currentTranscript) {
        processTranscript(currentTranscript.trim().toLowerCase(), handleState);
    }
}

function onSaveButtonClick() {
    userName = userNameInput.value;
    membershipNumber = membershipNumberInput.value;

    if (userName && membershipNumber) {
        // Dynamically update the prompt with user data
        conversationLogic['PROVIDING_INFO'].prompt = `My membership number is ${membershipNumber}. My name is ${userName}.`;
        startButton.disabled = false;
        saveButton.textContent = "Details Saved";
        saveButton.disabled = true;
        userNameInput.disabled = true;
        membershipNumberInput.disabled = true;
    } else {
        alert("Please fill in all details.");
    }
}

function onStartButtonClick() {
    // A user interaction is needed to start audio
    speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    handleState('IDLE');
    startButton.disabled = true;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        init,
        updateStatus,
        speak,
        addMessage,
        handleState,
        processTranscript,
        conversationLogic,
        // The following are not directly tested but needed for setup
        __private__: {
            setRecognition: r => recognition = r,
            setCurrentState: s => currentState = s,
            setVoices: v => voices = v,
            getVoices: () => voices,
            getCurrentState: () => currentState
        }
    };
}

