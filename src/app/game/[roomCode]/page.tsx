'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SocketProvider, useSocket } from '@/components/SocketProvider';
import Lobby from '@/components/Lobby';
import NightPhase from '@/components/NightPhase';
import DayPhase from '@/components/DayPhase';
import VotingPhase from '@/components/VotingPhase';
import GameOver from '@/components/GameOver';
import RoleCard from '@/components/RoleCard';
import Timer from '@/components/Timer';
import PlayerAvatar from '@/components/PlayerAvatar';
import { PHASE_LABELS } from '@/shared/constants';

function GameContent() {
  const params = useParams();
  const router = useRouter();
  const { gameState, playerId, isConnected, error, rejoinRoom, joinRoom } = useSocket();
  const roomCode = params.roomCode as string;
  const [rejoinStatus, setRejoinStatus] = useState<'pending' | 'attempting' | 'failed' | 'success'>('pending');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const attemptedRef = useRef(false);

  // Auto-rejoin on mount when connected
  useEffect(() => {
    if (!isConnected || attemptedRef.current || gameState) return;
    
    attemptedRef.current = true;
    setRejoinStatus('attempting');

    // Try to rejoin using sessionStorage data
    const storedPlayerId = sessionStorage.getItem('mafia_playerId');
    const storedName = sessionStorage.getItem('mafia_playerName');
    
    if (storedPlayerId && roomCode) {
      rejoinRoom(roomCode, storedPlayerId).then((success) => {
        if (success) {
          setRejoinStatus('success');
        } else {
          // Rejoin failed — show join form so user can enter as new player
          setRejoinStatus('failed');
          setShowJoinForm(true);
          if (storedName) setJoinName(storedName);
        }
      });
    } else {
      // No stored data — show join form
      setRejoinStatus('failed');
      setShowJoinForm(true);
    }
  }, [isConnected, gameState, roomCode, rejoinRoom]);

  // Handle joining as new player from the game page
  const handleJoinFromPage = async () => {
    if (!joinName.trim()) return;
    setJoinLoading(true);
    const result = await joinRoom(roomCode, joinName.trim());
    if (result) {
      sessionStorage.setItem('mafia_playerId', result.playerId);
      sessionStorage.setItem('mafia_playerName', joinName.trim());
      setShowJoinForm(false);
      setRejoinStatus('success');
    }
    setJoinLoading(false);
  };

  // Show join form if rejoin failed
  if (showJoinForm && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-8 w-full max-w-md animate-fadeIn">
          <h2 className="text-2xl font-bold text-center mb-2">Join Room</h2>
          <p className="text-[#94a1b2] text-sm text-center mb-6">
            Room: <span className="text-[#7f5af0] font-bold tracking-wider">{roomCode}</span>
          </p>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#e53170]/10 border border-[#e53170]/30">
              <p className="text-[#e53170] text-sm text-center">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#94a1b2] mb-1 block">Your Name</label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="input-field"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleJoinFromPage()}
              />
            </div>
            <button
              onClick={handleJoinFromPage}
              disabled={!joinName.trim() || joinLoading}
              className="btn-accent w-full"
            >
              {joinLoading ? 'Joining...' : '🚀 Join Game'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-ghost w-full"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center animate-pulse">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-[#94a1b2]">
            {rejoinStatus === 'attempting' ? 'Reconnecting...' : `Connecting to room ${roomCode}...`}
          </p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const phase = gameState.phase;

  // Phase header bar
  const renderHeader = () => {
    if (phase === 'lobby') return null;
    return (
      <div className="sticky top-0 z-50 glass-panel-solid px-4 py-2 mx-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            phase.includes('night') ? 'bg-[#7f5af0]/20 text-[#7f5af0]' :
            phase === 'game-over' ? 'bg-[#ff8906]/20 text-[#ff8906]' :
            'bg-[#2cb67d]/20 text-[#2cb67d]'
          }`}>
            {PHASE_LABELS[phase] || phase}
          </span>
          {gameState.round > 0 && (
            <span className="text-xs text-[#94a1b2]">Round {gameState.round}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentPlayer && (
            <div className="flex items-center gap-2">
              <PlayerAvatar
                color={currentPlayer.color}
                name={currentPlayer.name}
                isAlive={currentPlayer.isAlive}
                size="sm"
                showName={false}
              />
              <span className="text-sm font-medium hidden sm:block">{currentPlayer.name}</span>
              {!currentPlayer.isAlive && (
                <span className="text-xs text-[#e53170]">💀 Dead</span>
              )}
            </div>
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2cb67d]' : 'bg-[#e53170]'}`} />
        </div>
      </div>
    );
  };

  // Elimination result interstitial
  const renderEliminationResult = () => {
    const result = (gameState as any).eliminationResult;
    if (!result) return null;
    return (
      <div className="flex flex-col items-center gap-6 p-6 max-w-2xl mx-auto animate-fadeIn">
        <div className="text-center">
          <span className="text-4xl">⚖️</span>
          <h1 className="text-3xl font-black mt-2">Judgment</h1>
        </div>
        <div className="glass-panel p-8 text-center w-full">
          {result.eliminated ? (
            <div>
              <div className="flex justify-center mb-4">
                <PlayerAvatar
                  color={gameState.players.find(p => p.id === result.eliminated.id)?.color || '#666'}
                  name={result.eliminated.name}
                  isAlive={false}
                  size="lg"
                />
              </div>
              <p className="text-xl font-bold text-[#e53170]">
                {result.eliminated.name} has been eliminated!
              </p>
              <p className="text-[#94a1b2] mt-2">
                They were a <span className="font-bold text-white">{result.eliminated.role}</span>
              </p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">🤝</div>
              <p className="text-xl font-bold text-[#2cb67d]">No one was eliminated!</p>
              <p className="text-[#94a1b2] mt-1">The vote was tied or skipped.</p>
            </div>
          )}
        </div>
        <Timer endTime={gameState.phaseEndTime} />
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-8">
      {renderHeader()}
      
      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 glass-panel p-3 border-[#e53170]/50 text-center">
          <p className="text-[#e53170] text-sm">{error}</p>
        </div>
      )}

      {/* Phase Components */}
      <div className="mt-4">
        {phase === 'lobby' && <Lobby />}
        {phase === 'role-reveal' && currentPlayer?.role && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <RoleCard role={currentPlayer.role} />
            <p className="text-[#94a1b2] text-sm mt-4 animate-pulse">Night is falling...</p>
          </div>
        )}
        {phase === 'night' && <NightPhase />}
        {(phase === 'day-announcement' || phase === 'day-discussion') && <DayPhase />}
        {phase === 'day-voting' && <VotingPhase />}
        {phase === 'elimination-result' && renderEliminationResult()}
        {phase === 'game-over' && <GameOver />}
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <SocketProvider>
      <GameContent />
    </SocketProvider>
  );
}
