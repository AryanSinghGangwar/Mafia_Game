'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SocketProvider, useSocket } from '@/components/SocketProvider';

function LandingContent() {
  const router = useRouter();
  const { createRoom, joinRoom, error, clearError, isConnected } = useSocket();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    clearError();
    const result = await createRoom(name.trim());
    if (result) {
      // Store player info in sessionStorage for reconnection
      sessionStorage.setItem('mafia_playerId', result.playerId);
      sessionStorage.setItem('mafia_playerName', name.trim());
      router.push(`/game/${result.roomCode}`);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    clearError();
    const result = await joinRoom(roomCode.trim().toUpperCase(), name.trim());
    if (result) {
      sessionStorage.setItem('mafia_playerId', result.playerId);
      sessionStorage.setItem('mafia_playerName', name.trim());
      router.push(`/game/${result.roomCode}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Floating astronauts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[5%] text-6xl opacity-10 animate-float" style={{ animationDelay: '0s' }}>🧑🚀</div>
        <div className="absolute top-[30%] right-[8%] text-5xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>👽</div>
        <div className="absolute bottom-[20%] left-[15%] text-4xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>🔪</div>
        <div className="absolute bottom-[40%] right-[20%] text-5xl opacity-10 animate-float" style={{ animationDelay: '1.5s' }}>🛡️</div>
        <div className="absolute top-[60%] left-[60%] text-4xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>🔍</div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12 animate-slideUp">
          <h1 className="text-6xl md:text-7xl font-black mb-3">
            <span className="text-[#e53170]">M</span>
            <span className="text-[#7f5af0]">A</span>
            <span className="text-[#2cb67d]">F</span>
            <span className="text-[#ff8906]">I</span>
            <span className="text-[#7f5af0]">A</span>
          </h1>
          <p className="text-[#94a1b2] text-lg">Social Deduction Game</p>
          <div className={`mt-2 flex items-center justify-center gap-2 text-xs ${
            isConnected ? 'text-[#2cb67d]' : 'text-[#e53170]'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2cb67d]' : 'bg-[#e53170]'}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-panel p-4 mb-6 border-[#e53170]/50 text-center animate-fadeIn">
            <p className="text-[#e53170] text-sm">{error}</p>
            <button onClick={clearError} className="text-xs text-[#94a1b2] mt-1 underline">Dismiss</button>
          </div>
        )}

        {/* Home */}
        {mode === 'home' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <button
              onClick={() => setMode('create')}
              disabled={!isConnected}
              className="btn-primary text-lg py-4 w-full"
            >
              🎮 Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!isConnected}
              className="btn-accent text-lg py-4 w-full"
            >
              🚪 Join Room
            </button>

            {/* How to play */}
            <div className="glass-panel p-6 mt-4">
              <h3 className="font-bold mb-3 text-center">How to Play</h3>
              <div className="space-y-2 text-sm text-[#94a1b2]">
                <p>🔪 <span className="text-[#e53170] font-bold">Mafia</span> secretly eliminates players at night</p>
                <p>🛡️ <span className="text-[#2cb67d] font-bold">Doctor</span> protects one player each night</p>
                <p>🔍 <span className="text-[#7f5af0] font-bold">Sheriff</span> investigates one player each night</p>
                <p>👥 <span className="text-white font-bold">Town</span> votes to eliminate suspects by day</p>
                <p className="pt-2 text-xs">4-20 players • Find the Mafia before it's too late!</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Room */}
        {mode === 'create' && (
          <div className="glass-panel p-6 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 text-center">Create Room</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#94a1b2] mb-1 block">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="btn-primary w-full"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button onClick={() => setMode('home')} className="btn-ghost w-full">
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Join Room */}
        {mode === 'join' && (
          <div className="glass-panel p-6 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 text-center">Join Room</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#94a1b2] mb-1 block">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-letter code"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.2em] font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-[#94a1b2] mb-1 block">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="input-field"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!name.trim() || !roomCode.trim() || loading}
                className="btn-accent w-full"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
              <button onClick={() => setMode('home')} className="btn-ghost w-full">
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SocketProvider>
      <LandingContent />
    </SocketProvider>
  );
}
