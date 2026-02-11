import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// CORS Configuration - Allow both production and development origins
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local Vite dev server
    'http://localhost:3000', // Alternative local port
    'https://testing-of-client.vercel.app', // Old Production frontend
    'https://othrhalff.in', // New Domain
    'https://www.othrhalff.in', // New Domain (www)
    'https://othrhalff.vercel.app', // New Vercel Domain
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

// Agora: Generate RTC Token for Video/Audio Call
app.post('/api/agora-token', async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate a unique channel name for this call
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use a simple uid (0 means auto-assign)
    const uid = 0;

    // Token valid for 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token with publisher role (can send and receive)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      token,
      channelName,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agora: Initiate Call with Database Session
app.post('/api/initiate-call', async (req, res) => {
  try {
    const { receiverId, matchId } = req.body;

    if (!receiverId || !matchId) {
      return res.status(400).json({ error: 'receiverId and matchId are required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate unique channel name
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uid = 0;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    // Return call session info (caller will insert into Supabase)
    res.json({
      channelName,
      token,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/', (req, res) => {
  res.send('Backend API is running. Use the Vercel Frontend to interact.');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
