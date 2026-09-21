class GameEngine {
  constructor(roomManager) {
    this.roomManager = roomManager;
    this.timers = new Map(); // roomCode -> timer
  }

  // Role distribution based on player count
  getRoleDistribution(playerCount) {
    // 1 Mafia, 1 Doctor, 1 Sheriff for up to 10 players
    if (playerCount <= 10) return { mafia: 1, doctor: 1, sheriff: 1 };
    
    // Scale up for larger games
    if (playerCount <= 15) return { mafia: 2, doctor: 1, sheriff: 1 };
    return { mafia: Math.floor(playerCount / 5), doctor: 1, sheriff: 1 };
  }

  // Shuffle array (Fisher-Yates)
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Assign roles to players
  assignRoles(room) {
    const dist = this.getRoleDistribution(room.players.length);
    const roles = [];
    for (let i = 0; i < dist.mafia; i++) roles.push('mafia');
    if (dist.doctor > 0) roles.push('doctor');
    if (dist.sheriff > 0) roles.push('sheriff');
    while (roles.length < room.players.length) roles.push('villager');
    const shuffled = this.shuffle(roles);
    room.players.forEach((player, i) => {
      player.role = shuffled[i];
    });
  }

  // Start the game
  startGame(room, io) {
    if (room.players.length < 4) return { error: 'Need at least 4 players' };
    this.assignRoles(room);
    room.phase = 'role-reveal';
    room.round = 0;
    room.chat = [];
    
    // After 5 seconds, transition to night
    this.setPhaseTimer(room, 5000, () => {
      this.startNight(room, io);
    });
    
    return { success: true };
  }

  // Start night phase
  startNight(room, io) {
    room.phase = 'night';
    room.round += 1;
    room.players.forEach(p => {
      p.nightAction = null;
    });
    room.nightActions = {};
    
    const duration = 30000; // 30 seconds
    room.phaseEndTime = Date.now() + duration;
    
    // Emit phase change to all players
    this.emitToRoom(room, io);
    
    this.setPhaseTimer(room, duration, () => {
      this.resolveNight(room, io);
    });
  }

  // Handle night action submission
  submitNightAction(room, playerId, targetId, io) {
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive || room.phase !== 'night') return false;
    
    const target = room.players.find(p => p.id === targetId);
    if (!target || !target.isAlive) return false;
    
    // Validate action based on role
    if (player.role === 'mafia') {
      // Mafia can't target other mafia
      if (target.role === 'mafia') return false;
    }
    if (player.role === 'doctor') {
      // Doctor can protect anyone including self
    }
    if (player.role === 'sheriff') {
      // Sheriff can investigate anyone
    }
    if (player.role === 'villager') {
      // Villagers tap themselves (or another dummy target) just to blend in
      // We accept it so they have a task to do, but it doesn't affect resolution.
    }
    
    player.nightAction = targetId;
    room.nightActions[playerId] = { role: player.role, targetId };
    
    // Emit state update so other mafia members instantly see the target
    this.emitToRoom(room, io);
    
    // Check if all ALIVE players have submitted
    const pendingPlayers = room.players.filter(p => 
      p.isAlive && 
      p.nightAction === null
    );
    
    if (pendingPlayers.length === 0) {
      // All actions submitted, resolve immediately
      this.clearTimer(room.code);
      this.resolveNight(room, io);
    }
    
    return true;
  }

  // Resolve night phase
  resolveNight(room, io) {
    const results = { killed: null, saved: false, investigated: null };
    
    // Find mafia target (majority vote among mafia, or first mafia's target)
    const mafiaActions = Object.values(room.nightActions)
      .filter(a => a.role === 'mafia');
    
    let mafiaTarget = null;
    if (mafiaActions.length > 0) {
      // Count votes for each target
      const targetVotes = {};
      mafiaActions.forEach(a => {
        targetVotes[a.targetId] = (targetVotes[a.targetId] || 0) + 1;
      });
      // Get target with most votes
      mafiaTarget = Object.entries(targetVotes)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
    }
    
    // Find doctor's protection target
    const doctorAction = Object.values(room.nightActions)
      .find(a => a.role === 'doctor');
    const doctorTarget = doctorAction?.targetId;
    
    // Find sheriff's investigation target
    const sheriffAction = Object.values(room.nightActions)
      .find(a => a.role === 'sheriff');
    
    // Resolve kill
    if (mafiaTarget) {
      if (mafiaTarget === doctorTarget) {
        results.saved = true;
        results.savedPlayer = room.players.find(p => p.id === mafiaTarget)?.name;
      } else {
        const victim = room.players.find(p => p.id === mafiaTarget);
        if (victim) {
          victim.isAlive = false;
          results.killed = { id: victim.id, name: victim.name, role: victim.role };
        }
      }
    }
    
    // Resolve investigation
    if (sheriffAction) {
      const investigated = room.players.find(p => p.id === sheriffAction.targetId);
      if (investigated) {
        results.investigated = {
          playerId: sheriffAction.targetId,
          playerName: investigated.name,
          isMafia: investigated.role === 'mafia'
        };
        // Find the sheriff to send them the result
        const sheriff = room.players.find(p => p.role === 'sheriff' && p.isAlive);
        if (sheriff) {
          results.sheriffSocketId = sheriff.socketId;
        }
      }
    }
    
    // Check win conditions
    const winner = this.checkWinCondition(room);
    if (winner) {
      room.phase = 'game-over';
      room.winner = winner;
      room.phaseEndTime = null;
      this.emitGameOver(room, io, results);
      return;
    }
    
    // Transition to day
    room.phase = 'day-announcement';
    room.nightResults = results;
    room.phaseEndTime = Date.now() + 8000; // 8 sec announcement
    this.emitToRoom(room, io, { nightResults: results });
    
    this.setPhaseTimer(room, 8000, () => {
      this.startDayDiscussion(room, io);
    });
  }

  // Start day discussion
  startDayDiscussion(room, io) {
    room.phase = 'day-discussion';
    const duration = 60000; // 60 seconds
    room.phaseEndTime = Date.now() + duration;
    room.players.forEach(p => { p.vote = null; });
    room.votes = {};
    
    this.emitToRoom(room, io);
    
    this.setPhaseTimer(room, duration, () => {
      this.startVoting(room, io);
    });
  }

  // Start voting phase
  startVoting(room, io) {
    room.phase = 'day-voting';
    const duration = 30000; // 30 seconds
    room.phaseEndTime = Date.now() + duration;
    room.players.forEach(p => { p.vote = null; });
    room.votes = {};
    
    this.emitToRoom(room, io);
    
    this.setPhaseTimer(room, duration, () => {
      this.resolveVoting(room, io);
    });
  }

  // Handle vote submission
  submitVote(room, voterId, targetId, io) {
    const voter = room.players.find(p => p.id === voterId);
    if (!voter || !voter.isAlive || room.phase !== 'day-voting') return false;
    
    if (targetId !== 'skip') {
      const target = room.players.find(p => p.id === targetId && p.isAlive);
      if (!target) return false;
    }
    
    voter.vote = targetId;
    room.votes[voterId] = targetId;
    
    // Emit vote update
    this.emitToRoom(room, io);
    
    // Check if all alive players have voted
    const pendingVoters = room.players.filter(p => p.isAlive && p.vote === null);
    if (pendingVoters.length === 0) {
      this.clearTimer(room.code);
      this.resolveVoting(room, io);
    }
    
    return true;
  }

  // Resolve voting
  resolveVoting(room, io) {
    const voteCounts = {};
    let skipCount = 0;
    
    Object.values(room.votes).forEach(targetId => {
      if (targetId === 'skip') {
        skipCount++;
      } else {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });
    
    // Find player with most votes
    let maxVotes = 0;
    let eliminated = null;
    let isTie = false;
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminated = playerId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });
    
    // Skip wins or tie = no elimination
    if (isTie || skipCount >= maxVotes || maxVotes === 0) {
      eliminated = null;
    }
    
    let eliminatedPlayer = null;
    if (eliminated) {
      const player = room.players.find(p => p.id === eliminated);
      if (player) {
        player.isAlive = false;
        eliminatedPlayer = { id: player.id, name: player.name, role: player.role };
      }
    }
    
    // Check win conditions
    const winner = this.checkWinCondition(room);
    if (winner) {
      room.phase = 'game-over';
      room.winner = winner;
      room.phaseEndTime = null;
      this.emitGameOver(room, io, { eliminated: eliminatedPlayer, voteCounts, skipCount });
      return;
    }
    
    // Show elimination result then go to night
    room.phase = 'elimination-result';
    room.eliminationResult = { eliminated: eliminatedPlayer, voteCounts, skipCount };
    room.phaseEndTime = Date.now() + 5000;
    this.emitToRoom(room, io, { eliminationResult: room.eliminationResult });
    
    this.setPhaseTimer(room, 5000, () => {
      this.startNight(room, io);
    });
  }

  // Check win condition
  checkWinCondition(room) {
    const alive = room.players.filter(p => p.isAlive);
    const mafiaAlive = alive.filter(p => p.role === 'mafia').length;
    const townAlive = alive.filter(p => p.role !== 'mafia').length;
    
    if (mafiaAlive === 0) return 'town';
    if (mafiaAlive >= townAlive) return 'mafia';
    return null;
  }

  // Add chat message
  addChatMessage(room, playerId, message) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;
    // Only alive players can chat during day, dead players can never chat
    if (!player.isAlive) return false;
    if (!['day-discussion', 'day-voting'].includes(room.phase)) return false;
    
    room.chat.push({
      id: Date.now().toString(),
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      message: message.substring(0, 200), // Limit message length
      timestamp: Date.now()
    });
    
    // Keep only last 100 messages
    if (room.chat.length > 100) room.chat = room.chat.slice(-100);
    return true;
  }

  // Reset room for new game
  resetRoom(room) {
    room.phase = 'lobby';
    room.round = 0;
    room.chat = [];
    room.nightActions = {};
    room.votes = {};
    room.nightResults = null;
    room.eliminationResult = null;
    room.winner = null;
    room.phaseEndTime = null;
    room.players.forEach(p => {
      p.role = null;
      p.isAlive = true;
      p.nightAction = null;
      p.vote = null;
    });
    this.clearTimer(room.code);
  }

  // Timer management
  setPhaseTimer(room, duration, callback) {
    this.clearTimer(room.code);
    const timer = setTimeout(callback, duration);
    this.timers.set(room.code, timer);
  }

  clearTimer(roomCode) {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomCode);
    }
  }

  // Emit game state to all players in room (each gets their sanitized view)
  emitToRoom(room, io, extraData = {}) {
    room.players.forEach(player => {
      if (player.isConnected && player.socketId) {
        const state = this.roomManager.getSanitizedState(room, player.id);
        io.to(player.socketId).emit('game-state-update', { ...state, ...extraData });
      }
    });
  }

  // Emit game over to all players
  emitGameOver(room, io, extraData = {}) {
    room.players.forEach(player => {
      if (player.isConnected && player.socketId) {
        const state = this.roomManager.getSanitizedState(room, player.id);
        io.to(player.socketId).emit('game-state-update', { 
          ...state, 
          ...extraData,
          winner: room.winner 
        });
      }
    });
  }
}

module.exports = { GameEngine };
