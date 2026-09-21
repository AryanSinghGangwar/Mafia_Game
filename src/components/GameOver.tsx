'use client';

import React from 'react';
import { useSocket } from './SocketProvider';
import PlayerAvatar from './PlayerAvatar';
import { ROLE_INFO } from '@/shared/constants';

export default function GameOver() {
  const { gameState, playerId, playAgain } = useSocket();

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost;
  const winner = (gameState as any).winner;
  const eliminationResult = (gameState as any).eliminationResult;

  const mafiaWon = winner === 'mafia';
  const isMafia = currentPlayer?.role === 'mafia';
  const isWinner = (mafiaWon && isMafia) || (!mafiaWon && !isMafia);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 p-4 sm:p-6 max-w-2xl mx-auto animate-fadeIn">
      {/* Victory/Defeat Banner */}
      <div className={`glass-panel p-6 sm:p-8 text-center w-full border-2 ${
        mafiaWon ? 'border-[#e53170]/50' : 'border-[#2cb67d]/50'
      }`}>
        <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{mafiaWon ? '🔪' : '🎉'}</div>
        <h1 className={`text-3xl sm:text-4xl font-black mb-2 ${
          mafiaWon ? 'text-[#e53170]' : 'text-[#2cb67d]'
        }`}>
          {mafiaWon ? 'Mafia Wins!' : 'Town Wins!'}
        </h1>
        <p className="text-[#94a1b2] text-sm sm:text-lg">
          {mafiaWon
            ? 'The Mafia has taken over the town...'
            : 'All Mafia members have been eliminated!'}
        </p>
        <div className={`mt-3 sm:mt-4 text-xl sm:text-2xl font-bold ${
          isWinner ? 'text-[#2cb67d]' : 'text-[#e53170]'
        }`}>
          {isWinner ? '🏆 VICTORY' : '💀 DEFEAT'}
        </div>
      </div>

      {/* Last elimination result */}
      {eliminationResult?.eliminated && (
        <div className="glass-panel p-3 sm:p-4 text-center w-full">
          <p className="text-xs sm:text-sm text-[#94a1b2] mb-1">Last eliminated:</p>
          <p className="font-bold text-sm sm:text-base">
            {eliminationResult.eliminated.name} — {ROLE_INFO[eliminationResult.eliminated.role]?.emoji} {eliminationResult.eliminated.role}
          </p>
        </div>
      )}

      {/* All Roles Revealed */}
      <div className="glass-panel p-4 sm:p-6 w-full">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">All Roles Revealed</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
          {gameState.players.map((player) => {
            const info = player.role ? ROLE_INFO[player.role] : null;
            return (
              <div
                key={player.id}
                className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl ${
                  player.role === 'mafia' ? 'bg-[#e53170]/10' : 'bg-[#2cb67d]/10'
                } ${player.id === playerId ? 'ring-2 ring-[#7f5af0]' : ''}`}
              >
                <PlayerAvatar
                  color={player.color}
                  name={player.name}
                  isAlive={player.isAlive}
                  size="sm"
                />
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs font-bold">{info?.emoji} {info?.name}</p>
                  <p className={`text-[10px] sm:text-xs ${
                    player.role === 'mafia' ? 'text-[#e53170]' : 'text-[#2cb67d]'
                  }`}>
                    {info?.alignment}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 sm:gap-4 w-full max-w-xs">
        {isHost && (
          <button onClick={playAgain} className="btn-accent text-sm sm:text-lg flex-1 min-h-[48px]">
            🔄 Play Again
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="btn-ghost text-sm sm:text-lg flex-1 min-h-[48px]"
        >
          🏠 Leave
        </button>
      </div>
    </div>
  );
}
