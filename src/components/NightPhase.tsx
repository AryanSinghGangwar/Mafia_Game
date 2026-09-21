'use client';

import React, { useState } from 'react';
import { useSocket } from './SocketProvider';
import PlayerAvatar from './PlayerAvatar';
import Timer from './Timer';
import { ROLE_INFO } from '@/shared/constants';

export default function NightPhase() {
  const { gameState, playerId, submitNightAction } = useSocket();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasActed, setHasActed] = useState(false);

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  if (!currentPlayer) return null;

  const role = currentPlayer.role;
  const roleInfo = role ? ROLE_INFO[role] : null;
  const canAct = currentPlayer.isAlive && !hasActed && !currentPlayer.hasActed;

  const selectableTargets = gameState.players.filter(p => {
    if (!p.isAlive) return false;
    if (role === 'mafia' && p.role === 'mafia') return false; // Can't target fellow mafia
    if (role === 'villager' && p.id !== playerId) return false; // Villagers can only tap themselves
    if (role === 'sheriff' && p.id === playerId) return false; // Sheriff cannot investigate themselves
    return true;
  });

  const handleConfirm = () => {
    if (selectedTarget) {
      submitNightAction(selectedTarget);
      setHasActed(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-2xl mx-auto animate-fadeIn">
      <div className="night-overlay" />
      
      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">🌙</span>
          <h1 className="text-3xl font-black">Night {gameState.round}</h1>
        </div>
        <Timer endTime={gameState.phaseEndTime} />
      </div>

      {/* Role Info */}
      <div className="relative z-10 glass-panel-solid p-6 w-full text-center">
        <div className="text-3xl mb-2">{roleInfo?.emoji}</div>
        <h2 className="text-xl font-bold mb-1">{roleInfo?.name}</h2>
        <p className="text-[#94a1b2] text-sm">
          {canAct ? roleInfo?.nightAction : hasActed ? '✅ Action submitted. Waiting for others...' : roleInfo?.nightAction}
        </p>
      </div>

      {/* Mafia team indicator */}
      {role === 'mafia' && (
        <div className="relative z-10 glass-panel p-4 w-full">
          <p className="text-[#e53170] text-sm font-bold mb-2">🔪 Your Team:</p>
          <div className="flex gap-3 flex-wrap">
            {gameState.players.filter(p => p.role === 'mafia' && p.isAlive).map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <PlayerAvatar color={p.color} name={p.name} isAlive={true} size="sm" showName={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Selection */}
      {canAct ? (
        <div className="relative z-10 w-full">
          <p className="text-sm text-[#94a1b2] mb-3 text-center">Select your target:</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {selectableTargets.map((player) => {
              // Check if any other mafia has targeted this player
              const targetedBy = role === 'mafia' 
                ? gameState.players
                    .filter(p => p.role === 'mafia' && p.id !== playerId && p.actionTarget === player.id)
                    .map(p => p.name)
                : [];
                
              return (
                <div key={player.id} className="relative flex justify-center">
                  <PlayerAvatar
                    color={player.color}
                    name={player.name}
                    isAlive={player.isAlive}
                    isSelected={selectedTarget === player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    size="md"
                  />
                  {targetedBy.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-[#e53170] text-xs font-bold text-white px-2 py-1 rounded-full z-10 border border-[#0f0e17] shadow-lg animate-pulse-glow">
                      🔪 {targetedBy.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={handleConfirm}
              disabled={!selectedTarget}
              className="btn-danger text-lg"
            >
              ✓ Confirm
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
