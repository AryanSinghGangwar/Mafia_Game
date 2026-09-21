const { nanoid } = require('nanoid');

// Sanitized alphabet - no ambiguous chars (0,O,1,I,L)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateCode() {
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostName, hostSocketId) {
    const code = this.generateCode();
    const hostId = nanoid(10);
    const player = {
      id: hostId,
      socketId: hostSocketId,
      name: hostName,
      color: this.getAvailableColor([]),
      role: null,
      isAlive: true,
      isHost: true,
      isConnected: true,
      nightAction: null,
      vote: null
    };
    const room = {
      code,
      players: [player],
      gameState: null,
      phase: 'lobby',
      round: 0,
      nightActions: {},
      votes: {},
      chat: [],
      phaseEndTime: null,
      createdAt: Date.now()
    };
    this.rooms.set(code, room);
    return { room, player };
  }

  joinRoom(code, playerName, socketId) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.phase !== 'lobby') return { error: 'Game already in progress' };
    if (room.players.length >= 20) return { error: 'Room is full' };
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return { error: 'Name already taken in this room' };
    }
    const playerId = nanoid(10);
    const takenColors = room.players.map(p => p.color);
    const player = {
      id: playerId,
      socketId,
      name: playerName,
      color: this.getAvailableColor(takenColors),
      role: null,
      isAlive: true,
      isHost: false,
      isConnected: true,
      nightAction: null,
      vote: null
    };
    room.players.push(player);
    return { room, player };
  }

  // Reconnect a disconnected player
  reconnectPlayer(code, playerId, newSocketId) {
    const room = this.rooms.get(code);
    if (!room) return null;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;
    player.socketId = newSocketId;
    player.isConnected = true;
    return { room, player };
  }

  removePlayer(code, socketId) {
    const room = this.rooms.get(code);
    if (!room) return null;
    // Find by socketId or by matching disconnected player's old socketId
    const idx = room.players.findIndex(p => p.socketId === socketId);
    if (idx === -1) return null;
    const removed = room.players[idx];
    
    // Always remove from array (called after grace period)
    room.players.splice(idx, 1);
    
    // Host migration
    if (removed.isHost && room.players.length > 0) {
      const newHost = room.players.find(p => p.isConnected);
      if (newHost) newHost.isHost = true;
    }
    
    // Clean up empty rooms
    if (room.players.length === 0) {
      this.rooms.delete(code);
      return { room: null, removed };
    }
    
    return { room, removed };
  }

  getRoom(code) {
    return this.rooms.get(code?.toUpperCase()) || null;
  }

  findRoomBySocketId(socketId) {
    for (const [code, room] of this.rooms) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) return { code, room, player };
    }
    return null;
  }

  // Among Us color palette - 12 colors
  getAvailableColor(takenColors) {
    const colors = [
      '#c51111', // red
      '#132ed1', // blue
      '#117f2d', // green
      '#ed54ba', // pink
      '#ef7d0e', // orange
      '#f5f557', // yellow
      '#3f474e', // black/dark
      '#d6e0f0', // white
      '#6b2fbb', // purple
      '#71491e', // brown
      '#38fedb', // cyan
      '#50ef39', // lime
    ];
    const available = colors.filter(c => !takenColors.includes(c));
    return available.length > 0 ? available[0] : colors[Math.floor(Math.random() * colors.length)];
  }

  // Get sanitized room state (no secrets exposed)
  getSanitizedState(room, forPlayerId) {
    const player = room.players.find(p => p.id === forPlayerId);
    return {
      code: room.code,
      phase: room.phase,
      round: room.round,
      phaseEndTime: room.phaseEndTime,
      chat: room.chat,
      players: room.players.map(p => {
        const sanitized = {
          id: p.id,
          name: p.name,
          color: p.color,
          isAlive: p.isAlive,
          isHost: p.isHost,
          isConnected: p.isConnected,
          role: null, // Hidden by default
          hasVoted: p.vote !== null,
          hasActed: p.nightAction !== null,
          actionTarget: null
        };
        // Show own role
        if (p.id === forPlayerId) {
          sanitized.role = p.role;
        }
        // Mafia can see other mafia and their targets
        if (player && player.role === 'mafia' && p.role === 'mafia') {
          sanitized.role = 'mafia';
          sanitized.actionTarget = p.nightAction;
        }
        // Dead players can see all roles
        if (player && !player.isAlive) {
          sanitized.role = p.role;
        }
        // Game over - reveal all
        if (room.phase === 'game-over') {
          sanitized.role = p.role;
        }
        return sanitized;
      })
    };
  }
}

module.exports = { RoomManager };
