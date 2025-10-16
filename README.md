# Ticnote - Audio Transcription & Synthesis Application

A web application that allows you to transcribe, synthesize, and question audio recordings from your phone's dictaphone, similar to the Ticnote service.

## Features

- Audio recording directly from the browser
- Audio file upload functionality
- Speech-to-text transcription
- AI-powered text summarization
- Question-answering about transcribed content
- **No authentication required** (personal use version)
- Real-time updates using WebSockets

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: React.js, Vite
- **Real-time Communication**: Socket.IO
- **Audio Processing**: Multer for file uploads

## Project Structure

```
ticnote/
├── client/              # React frontend
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   └── dist/            # Built files
├── server/              # Node.js backend
│   ├── models/          # Data models (removed for personal version)
│   ├── middleware/      # Express middleware (authentication removed)
│   ├── services/        # Business logic
│   └── server.js        # Main server file
├── public/              # Publicly served files
├── uploads/             # Uploaded audio files
└── test/                # Test files
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ticnote
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   cd client
   npm run dev
   ```

   Or build and serve the frontend:
   ```bash
   npm run build
   # The built files are automatically served by the backend
   ```

3. Open your browser and navigate to `http://localhost:5001`

### Usage

1. Record audio directly using the "Record Audio" button or upload an existing audio file

2. Click "Upload Audio" to process the file

3. View the transcribed text and AI-generated summary

4. Ask questions about the transcribed content using the question input field

## API Endpoints

- `POST /upload` - Upload and process audio files (no authentication required)
- `POST /ask` - Ask questions about transcribed content (no authentication required)

## WebSocket Events

- `audioProcessed` - Sent when audio processing is complete
- `questionAnswered` - Sent when a question has been answered
- `questionError` - Sent when there's an error answering a question

## Deployment

To deploy the application:

1. Build the frontend:
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. Copy the built files to the public directory:
   ```bash
   xcopy client/dist/* public/ /E /I /H /Y
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Future Improvements

- Integrate with actual speech recognition APIs (Google Cloud Speech-to-Text, AWS Transcribe, etc.)
- Implement real AI services for summarization and question-answering (OpenAI GPT, etc.)
- Add user registration and database integration
- Implement audio file management and storage
- Add support for multiple languages
- Improve the UI/UX design
- Add mobile responsiveness enhancements

## License

This project is licensed under the MIT License.

## Acknowledgments

- This application was created as a clone of the Ticnote service for educational purposes
- Thanks to all the open-source libraries and tools that made this project possible