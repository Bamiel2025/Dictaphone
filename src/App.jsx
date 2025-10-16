import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Web Speech API variables
let recognition = null;

// Fonction pour exporter en texte simple
const exportAsText = (transcription, summary) => {
  const content = `TRANSCRIPTION AUDIO\n\n${transcription}\n\nRÉSUMÉ\n\n${summary || 'Aucun résumé disponible'}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transcription.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Initialize Web Speech API
const initSpeechRecognition = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fr-FR'; // French language

    return true;
  }
  return false;
};

// Remove socket.io connection for Vercel deployment

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setError('');
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      // Enhanced constraints for better iPhone compatibility
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
          // Additional constraints for iOS
          ...(navigator.userAgent.includes('Safari') && {
            deviceId: 'default'
          })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/mp4'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = mimeType.includes('webm') ? 'webm' : 'm4a';
        const file = new File([audioBlob], `recording.${extension}`, { type: mimeType });
        setAudioFile(file);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error accessing microphone:', err);
      let errorMessage = 'Could not access microphone. ';

      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please check your device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Microphone does not support the required audio format.';
      } else {
        errorMessage += 'Please check permissions and try again.';
      }

      setError(errorMessage);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Initialize speech recognition and check permissions on component mount
  useEffect(() => {
    const initializeApp = async () => {
      // Check if Web Speech API is supported
      const speechSupported = initSpeechRecognition();
      setSpeechSupported(speechSupported);

      if (!speechSupported) {
        setError('Web Speech API not supported in this browser. Please use Chrome, Edge, or Safari.');
      }

      // Check microphone permissions
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          if (permission.state === 'denied') {
            setError('Microphone access is blocked. Please enable it in your browser settings.');
          }
        }
      } catch (err) {
        console.log('Permission check not supported');
      }
    };

    initializeApp();
  }, []);

  // Start speech recognition
  const startSpeechRecognition = () => {
    if (!recognition) {
      setError('Speech recognition not available');
      return;
    }

    setIsListening(true);
    setError('');
    setTranscription('');
    setSummary('');

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech recognized:', transcript);
      setTranscription(transcript);
      setIsListening(false);

      // Automatically generate summary after transcription
      generateSummary(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  };

  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Generate summary using Gemini API
  const generateSummary = async (text) => {
    if (!text) return;

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
      } else {
        console.error('Summary generation failed:', data.error);
      }
    } catch (err) {
      console.error('Summary generation error:', err);
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Upload audio file
  const uploadAudio = async () => {
    if (!audioFile) {
      setError('Please select or record an audio file first.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setTranscription('');
    setSummary('');
    setAnswer('');

    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      console.log('Sending request to /upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setTranscription(data.transcription || 'Transcription completed but no text returned');
        setSummary(data.summary || 'Summary completed but no text returned');
        console.log('Transcription set:', data.transcription);
        console.log('Summary set:', data.summary);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ask a question about the transcription
  const askQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    if (!transcription) {
      setError('Please upload and process an audio file first.');
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          context: transcription
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnswer(data.answer);
      } else {
        setError(data.error || 'Failed to get answer');
      }
    } catch (err) {
      console.error('Question error:', err);
      setError('Failed to ask question. Please try again.');
    }
  };

  // Remove socket event handlers for Vercel deployment

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ticnote - Audio Transcription & Synthesis</h1>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="upload-section">
          <h2>Upload Audio or Use Voice Recognition</h2>
          <div className="upload-controls">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              capture="microphone"
            />
            <button
              onClick={toggleRecording}
              className={isRecording ? 'recording' : ''}
            >
              {isRecording ? 'Stop Recording' : 'Record Audio'}
            </button>
            <button
              onClick={uploadAudio}
              disabled={isProcessing || (!audioFile && !isRecording)}
            >
              {isProcessing ? 'Processing...' : 'Upload Audio'}
            </button>
          </div>

          {speechSupported && (
            <div className="speech-controls">
              <h3>Reconnaissance Vocale (Gratuit)</h3>
              <button
                onClick={toggleSpeechRecognition}
                className={isListening ? 'listening' : 'speech'}
                disabled={isProcessing}
              >
                {isListening ? '🎤 Écoute en cours...' : '🎙️ Démarrer la Reconnaissance Vocale'}
              </button>
              <p className="speech-info">
                Cliquez pour parler directement - la transcription se fait dans votre navigateur (gratuit, aucune clé API nécessaire)
              </p>
            </div>
          )}
        </section>

        {isProcessing && (
          <section className="processing-section">
            <h2>Processing Audio...</h2>
            <p>Your audio is being transcribed and analyzed. This may take a moment.</p>
          </section>
        )}

        {(transcription || summary) && (
          <section className="results-section">
            <h2>Transcription Result</h2>
            <div className="transcription">
              <h3>Transcribed Text</h3>
              <textarea
                value={transcription || 'No transcription available'}
                readOnly
                placeholder="Transcribed text will appear here..."
              />
            </div>

            {summary && (
              <div className="summary">
                <h3>AI Summary</h3>
                <p>{summary}</p>
              </div>
            )}

            <div className="question-section">
              <h3>Ask Questions About Your Audio</h3>
              <div className="question-input">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question here..."
                />
                <button onClick={askQuestion}>Ask</button>
              </div>

              {answer && (
                <div className="answer">
                  <h4>Answer:</h4>
                  <p>{answer}</p>
                </div>
              )}
            </div>

            <div className="export-section">
              <h3>Export Transcription</h3>
              <div className="export-buttons">
                <button onClick={() => exportAsText(transcription, summary)}>
                  Export as TXT
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;