const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TranscriptionService = require('./services/transcriptionService');
const AIService = require('./services/ai/aiService');

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const multerUpload = upload.single('audio');

  multerUpload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      // Process the audio file
      const transcription = await TranscriptionService.transcribe(req.file.path);

      // Generate summary
      const summary = await AIService.summarize(transcription);

      res.status(200).json({
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
}