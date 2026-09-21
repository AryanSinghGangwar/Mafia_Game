const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 60000,
      skipMiddlewares: true
    }
  });

  // Initialize socket handlers
  const { setupSocketHandlers } = require('./src/server/socketHandlers');
  setupSocketHandlers(io);

  // Let Next.js handle all other routes
  expressApp.all('*', (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`> Mafia server ready on http://localhost:${port}`);
  });
});
