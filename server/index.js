import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// CORS Configuration - Allow both production and development origins
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local Vite dev server
    'http://localhost:3000', // Alternative local port
    'https://testing-of-client.vercel.app', // Production frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Daily.co: Create Video Call Room
app.post('/api/create-room', async (req, res) => {
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          exp: Math.floor(Date.now() / 1000) + 1800, // Expires in 30 minutes
          enable_screenshare: true,
          enable_chat: false,
          start_video_off: false,
          start_audio_off: false
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create room');
    }

    res.json({ roomUrl: data.url, roomName: data.name });
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root Message
app.get('/', (req, res) => {
  res.send('Backend API is running. Use the Vercel Frontend to interact.');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
