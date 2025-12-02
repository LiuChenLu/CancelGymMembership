// Mock the SpeechRecognition API
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.onresult = null;
    this.onerror = null;
  }

  start() {}
  stop() {}
}

global.SpeechRecognition = MockSpeechRecognition;
global.webkitSpeechRecognition = MockSpeechRecognition;

// Mock the SpeechSynthesis API
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  }
}

global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
global.speechSynthesis = {
  speak: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Google US English', lang: 'en-US' },
    { name: 'Google UK English Female', lang: 'en-GB' },
  ]),
  onvoiceschanged: null,
};
