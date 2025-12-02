const {
    init,
    processTranscript,
    conversationLogic,
    __private__: {
        setRecognition,
        setCurrentState,
        setVoices,
    }
} = require('./script');

// Mock the DOM elements
document.body.innerHTML = `
    <div id="conversation"></div>
    <span id="status"></span>
    <button id="processSpeechButton"></button>
    <div id="realtime-transcript"></div>
    <button id="startButton"></button>
    <button id="saveButton"></button>
    <input id="userName" />
    <input id="membershipNumber" />
`;

// Mock the global recognition object
const mockRecognition = {
    start: jest.fn(),
    stop: jest.fn(),
};

describe('Conversation Logic', () => {
    let handleStateMock;

    beforeEach(() => {
        // Initialize the DOM elements and the script
        init();

        // Reset the state before each test
        setRecognition(mockRecognition);
        setCurrentState('IDLE');
        setVoices([]);
        
        // Create a new mock for each test
        handleStateMock = jest.fn();
    });

    test('should transition from WAITING_FOR_RESPONSE to PROVIDING_INFO on "okay"', () => {
        setCurrentState('WAITING_FOR_RESPONSE');
        processTranscript('okay', handleStateMock);
        expect(handleStateMock).toHaveBeenCalledWith('PROVIDING_INFO');
    });

    test('should transition from WAITING_FOR_RESPONSE to HANDLING_OBJECTIONS on "why"', () => {
        setCurrentState('WAITING_FOR_RESPONSE');
        processTranscript('why are you calling', handleStateMock);
        expect(handleStateMock).toHaveBeenCalledWith('HANDLING_OBJECTIONS');
    });

    test('should transition from CONFIRMING_CANCELLATION to ENDING_CALL on "yes"', () => {
        setCurrentState('CONFIRMING_CANCELLATION');
        processTranscript('yes it is done', handleStateMock);
        expect(handleStateMock).toHaveBeenCalledWith('ENDING_CALL');
    });

    test('should transition to the default state if no keywords are matched', () => {
        setCurrentState('WAITING_FOR_RESPONSE');
        processTranscript('hello there', handleStateMock);
        expect(handleStateMock).toHaveBeenCalledWith(conversationLogic['WAITING_FOR_RESPONSE'].responses.default);
    });

    test('should handle multiple keywords in the transcript', () => {
        setCurrentState('WAITING_FOR_RESPONSE');
        processTranscript('okay sure, go ahead', handleStateMock);
        expect(handleStateMock).toHaveBeenCalledWith('PROVIDING_INFO');
    });
});
