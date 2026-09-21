const { RoomManager } = require('./RoomManager');
const { GameEngine } = require('./GameEngine');

function setupSocketHandlers(io) {
  const roomManager = new RoomManager();
  const gameEngine = new GameEngine(roomManager);
  
  // Track disconnect grace timers: socketId -> { timeout, roomCode, playerId }
  const disconnectTimers = new Map();

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create a room
    socket.on('create-room', ({ playerName }, callback) => {
      if (!playerName || playerName.trim().length === 0) {
        return callback({ error: 'Name is required' });
      }
      const name = playerName.trim().substring(0, 20);
      const { room, player } = roomManager.createRoom(name, socket.id);
      socket.join(room.code);
      callback({ 
        success: true, 
        roomCode: room.code, 
        playerId: player.id,
        state: roomManager.getSanitizedState(room, player.id)
      });
    });

    // Join a room
    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      if (!playerName || playerName.trim().length === 0) {
        return callback({ error: 'Name is required' });
      }
      if (!roomCode || roomCode.trim().length === 0) {
        return callback({ error: 'Room code is required' });
      }
      const name = playerName.trim().substring(0, 20);
      const code = roomCode.trim().toUpperCase();
      const result = roomManager.joinRoom(code, name, socket.id);
      if (result.error) {
        return callback({ error: result.error });
      }
      socket.join(code);
      
      // Notify all players in room about the update
      gameEngine.emitToRoom(result.room, io);
      
      callback({ 
        success: true, 
        roomCode: code, 
        playerId: result.player.id,
        state: roomManager.getSanitizedState(result.room, result.player.id)
      });
    });

    // Rejoin a room (reconnect after refresh/disconnect)
    socket.on('rejoin-room', ({ roomCode, playerId }, callback) => {
      if (!roomCode || !playerId) {
        return callback({ error: 'Room code and player ID required' });
      }
      const code = roomCode.trim().toUpperCase();
      
      // Cancel any pending disconnect timer for this player
      for (const [key, timer] of disconnectTimers) {
        if (timer.playerId === playerId && timer.roomCode === code) {
          clearTimeout(timer.timeout);
          disconnectTimers.delete(key);
          console.log(`Cancelled disconnect timer for player ${playerId}`);
        }
      }
      
      const result = roomManager.reconnectPlayer(code, playerId, socket.id);
      if (!result) {
        return callback({ error: 'Room not found or player not in room' });
      }
      
      socket.join(code);
      
      // Notify all players
      gameEngine.emitToRoom(result.room, io);
      
      callback({
        success: true,
        roomCode: code,
        playerId: result.player.id,
        state: roomManager.getSanitizedState(result.room, result.player.id)
      });
    });

    // Start the game
    socket.on('start-game', ({ roomCode }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ error: 'Room not found' });
      
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player || !player.isHost) {
        return callback({ error: 'Only the host can start the game' });
      }
      
      const result = gameEngine.startGame(room, io);
      if (result.error) return callback({ error: result.error });
      
      // Send each player their personal game state (with their role)
      gameEngine.emitToRoom(room, io);
      
      callback({ success: true });
    });

    // Night action
    socket.on('night-action', ({ roomCode, targetId }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ error: 'Room not found' });
      
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return callback({ error: 'Player not found' });
      
      const success = gameEngine.submitNightAction(room, player.id, targetId, io);
      callback({ success });
    });

    // Day vote
    socket.on('day-vote', ({ roomCode, targetId }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ error: 'Room not found' });
      
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return callback({ error: 'Player not found' });
      
      const success = gameEngine.submitVote(room, player.id, targetId, io);
      callback({ success });
    });

    // Chat message
    socket.on('chat-message', ({ roomCode, message }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;
      
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;
      
      const success = gameEngine.addChatMessage(room, player.id, message);
      if (success) {
        gameEngine.emitToRoom(room, io);
      }
    });

    // Play again (reset room)
    socket.on('play-again', ({ roomCode }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return callback({ error: 'Room not found' });
      
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player || !player.isHost) {
        return callback({ error: 'Only the host can restart' });
      }
      
      gameEngine.resetRoom(room);
      gameEngine.emitToRoom(room, io);
      callback({ success: true });
    });

    // Disconnect — use grace period instead of immediate removal
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      const found = roomManager.findRoomBySocketId(socket.id);
      if (!found) return;
      
      const { code, room, player } = found;
      
      // Mark player as disconnected immediately (so UI shows them as offline)
      player.isConnected = false;
      gameEngine.emitToRoom(room, io);
      
      // Set a grace period before actually removing
      const GRACE_PERIOD = 15000; // 15 seconds for refresh
      const timeout = setTimeout(() => {
        disconnectTimers.delete(socket.id);
        
        // Check if player is still disconnected (wasn't reconnected)
        const currentRoom = roomManager.getRoom(code);
        if (!currentRoom) return;
        
        const currentPlayer = currentRoom.players.find(p => p.id === player.id);
        if (!currentPlayer || currentPlayer.isConnected) return;
        
        // Now actually remove them
        console.log(`Grace period expired for ${player.name} in room ${code}`);
        const result = roomManager.removePlayer(code, currentPlayer.socketId);
        if (result && result.room) {
          gameEngine.emitToRoom(result.room, io);
        }
      }, GRACE_PERIOD);
      
      disconnectTimers.set(socket.id, {
        timeout,
        roomCode: code,
        playerId: player.id,
      });
    });
  });
}

module.exports = { setupSocketHandlers };
