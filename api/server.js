const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TranscriptionService = require('./services/transcriptionService');
const AIService = require('./services/ai/aiService');
// Removed auth middleware since we're removing authentication
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
  res.send('Ticnote Backend Server is Running!');
});

// Removed login endpoint since we're removing authentication

// Upload endpoint - removed authentication middleware
app.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  try {
    // Process the audio file
    const transcription = await TranscriptionService.transcribe(req.file.path);
    
    // Generate summary
    const summary = await AIService.summarize(transcription);
    
    // Emit event to all connected clients
    io.emit('audioProcessed', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      transcription: transcription,
      summary: summary
    });
    
    res.json({
      message: 'File processed successfully',
      file: req.file,
      transcription: transcription,
      summary: summary
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Question endpoint - removed authentication middleware
app.post('/ask', async (req, res) => {
  const { question, context } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  
  try {
    const answer = await AIService.answerQuestion(question, context);
    res.json({ answer });
  } catch (error) {
    console.error('Question answering error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle question from client
  socket.on('askQuestion', async (data) => {
    try {
      const { question, context } = data;
      const answer = await AIService.answerQuestion(question, context);
      
      // Send answer back to the specific client
      socket.emit('questionAnswered', {
        question,
        answer
      });
    } catch (error) {
      console.error('Question answering error:', error);
      socket.emit('questionError', { error: 'Failed to answer question' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});