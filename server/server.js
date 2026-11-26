require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const roomRoutes = require('./routes/roomRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const setupGameSocket = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/voice', voiceRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Ludo Champion Multiplayer & Voice Server',
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 5e7, // 50MB for audio bursts
});

app.set('io', io);

setupGameSocket(io);

// Server initialization
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer(port = PORT, host = HOST) {
  await connectDB();
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      console.log(`===============================================`);
      console.log(`🎲 Ludo Champion Multiplayer Server Running`);
      console.log(`🚀 Port: ${port}`);
      console.log(`🌐 Address: http://${host}:${port}`);
      console.log(`🎤 LiveKit Voice: Configured`);
      console.log(`===============================================`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
