import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
let port = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve static files from the React app
const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  // Only serve index.html if it's not an API call
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// Create server and handle error if port is in use
const server = http.createServer(app);

const startServer = (portToTry) => {
  server.listen(portToTry, () => {
    console.log(`Server running on port ${portToTry}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} is busy, trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error(err);
    }
  });
};

startServer(port);
