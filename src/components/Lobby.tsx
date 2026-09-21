'use client';

import React, { useState } from 'react';
import { useSocket } from './SocketProvider';
import PlayerAvatar from './PlayerAvatar';
import { GAME_CONFIG } from '@/shared/constants';

export default function Lobby() {
  const { gameState, playerId, startGame } = useSocket();
  const [copied, setCopied] = useState(false);

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost;
  const canStart = gameState.players.length >= GAME_CONFIG.MIN_PLAYERS;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameState.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareRoom = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my Mafia game!',
          text: `Join my Mafia game! Room code: ${gameState.code}`,
          url,
        });
      } else {
        copyCode();
      }
    } catch {}
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 p-4 sm:p-6 max-w-2xl mx-auto animate-fadeIn">
      {/* Room Code */}
      <div className="glass-panel p-4 sm:p-8 text-center w-full">
        <p className="text-[#94a1b2] text-xs sm:text-sm uppercase tracking-wider mb-1 sm:mb-2">Room Code</p>
        <button
          onClick={copyCode}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.2em] sm:tracking-[0.3em] text-[#7f5af0] hover:text-[#6b46e0] transition-colors"
        >
          {gameState.code}
        </button>
        <div className="flex items-center justify-center gap-3 mt-2">
          <p className="text-[#94a1b2] text-xs">
            {copied ? '✅ Copied!' : 'Tap to copy'}
          </p>
          <button onClick={shareRoom} className="text-xs text-[#7f5af0] underline">
            📤 Share
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="glass-panel p-4 sm:p-6 w-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold">Players</h2>
          <span className="text-[#94a1b2] text-xs sm:text-sm">
            {gameState.players.length} / {GAME_CONFIG.MAX_PLAYERS}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
          {gameState.players.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-1">
              <PlayerAvatar
                color={player.color}
                name={player.name}
                isAlive={true}
                size="md"
                isConnected={player.isConnected}
              />
              {player.isHost && (
                <span className="text-[10px] sm:text-xs text-[#ff8906] font-bold">👑 Host</span>
              )}
              {player.id === playerId && (
                <span className="text-[10px] sm:text-xs text-[#7f5af0] font-bold">You</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full">
        {isHost ? (
          <>
            <button
              onClick={startGame}
              disabled={!canStart}
              className="btn-accent text-base sm:text-lg w-full max-w-xs min-h-[48px]"
            >
              {canStart ? '🚀 Start Game' : `Need ${GAME_CONFIG.MIN_PLAYERS - gameState.players.length} more`}
            </button>
            {!canStart && (
              <p className="text-[#94a1b2] text-xs sm:text-sm">
                Minimum {GAME_CONFIG.MIN_PLAYERS} players required
              </p>
            )}
          </>
        ) : (
          <div className="glass-panel p-3 sm:p-4 text-center w-full">
            <p className="text-[#94a1b2] text-sm">⏳ Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
