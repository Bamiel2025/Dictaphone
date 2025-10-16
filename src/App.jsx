import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to socket.io server
const socket = io();

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  
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

  // Check microphone permissions on component mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
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

    checkMicrophonePermission();
  }, []);

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setTranscription(data.transcription);
        setSummary(data.summary);
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
      socket.emit('askQuestion', {
        question: question,
        context: transcription
      });
    } catch (err) {
      console.error('Question error:', err);
      setError('Failed to ask question. Please try again.');
    }
  };

  // Handle socket events
  useEffect(() => {
    socket.on('audioProcessed', (data) => {
      setTranscription(data.transcription);
      setSummary(data.summary);
      setIsProcessing(false);
    });

    socket.on('questionAnswered', (data) => {
      setAnswer(data.answer);
    });

    socket.on('questionError', (data) => {
      setError(data.error);
    });

    // Cleanup
    return () => {
      socket.off('audioProcessed');
      socket.off('questionAnswered');
      socket.off('questionError');
    };
  }, []);

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
          <h2>Upload or Record Audio</h2>
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
        </section>

        {isProcessing && (
          <section className="processing-section">
            <h2>Processing Audio...</h2>
            <p>Your audio is being transcribed and analyzed. This may take a moment.</p>
          </section>
        )}

        {transcription && (
          <section className="results-section">
            <h2>Transcription Result</h2>
            <div className="transcription">
              <h3>Transcribed Text</h3>
              <textarea 
                value={transcription} 
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
          </section>
        )}
      </main>
    </div>
  );
}

export default App;