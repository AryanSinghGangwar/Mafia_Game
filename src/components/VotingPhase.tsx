'use client';

import React, { useState } from 'react';
import { useSocket } from './SocketProvider';
import PlayerAvatar from './PlayerAvatar';
import Timer from './Timer';
import ChatBox from './ChatBox';

export default function VotingPhase() {
  const { gameState, playerId, submitVote, sendChatMessage } = useSocket();
  const [hasVoted, setHasVoted] = useState(false);

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const canVote = currentPlayer?.isAlive && !hasVoted;
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const votedCount = gameState.players.filter(p => p.isAlive && p.hasVoted).length;
  const totalAlive = alivePlayers.length;

  const handleVote = (targetId: string) => {
    submitVote(targetId);
    setHasVoted(true);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <span className="text-3xl sm:text-4xl">🗳️</span>
          <h1 className="text-2xl sm:text-3xl font-black">Town Vote</h1>
        </div>
        <p className="text-[#94a1b2] text-xs sm:text-sm">Vote to eliminate a suspect (majority rules)</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Timer endTime={gameState.phaseEndTime} />
          <span className="text-xs sm:text-sm text-[#94a1b2]">
            {votedCount}/{totalAlive} voted
          </span>
        </div>
      </div>

      {/* Voting Grid */}
      {canVote ? (
        <div className="glass-panel p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-[#94a1b2] mb-3 sm:mb-4 text-center">Tap a player to vote for elimination:</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {alivePlayers.filter(p => p.id !== playerId).map((player) => (
              <PlayerAvatar
                key={player.id}
                color={player.color}
                name={player.name}
                isAlive={true}
                onClick={() => handleVote(player.id)}
                size="md"
              />
            ))}
          </div>
          <div className="flex justify-center mt-4 sm:mt-6">
            <button
              onClick={() => handleVote('skip')}
              className="btn-ghost min-h-[48px] w-full max-w-xs"
            >
              ⏩ Skip Vote
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-4 sm:p-6 text-center">
          {hasVoted ? (
            <p className="text-[#2cb67d] font-bold">✅ Vote submitted! Waiting for others...</p>
          ) : (
            <p className="text-[#94a1b2]">👻 You are a spectator. Watching the vote...</p>
          )}
        </div>
      )}

      {/* Alive players status */}
      <div className="glass-panel p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#94a1b2] uppercase tracking-wider mb-2 sm:mb-3">Vote Status</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
          {alivePlayers.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-1">
              <PlayerAvatar
                color={player.color}
                name={player.name}
                isAlive={true}
                size="sm"
              />
              {player.hasVoted && (
                <span className="text-[10px] sm:text-xs text-[#2cb67d]">✓ Voted</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <ChatBox
        messages={gameState.chat}
        onSendMessage={sendChatMessage}
        disabled={!currentPlayer?.isAlive}
        placeholder="Last words before the vote..."
      />
    </div>
  );
}
