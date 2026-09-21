'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/shared/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  playerId: string | null;
  roomCode: string | null;
  error: string | null;
  createRoom: (playerName: string) => Promise<{ roomCode: string; playerId: string } | null>;
  joinRoom: (roomCode: string, playerName: string) => Promise<{ roomCode: string; playerId: string } | null>;
  rejoinRoom: (roomCode: string, playerId: string) => Promise<boolean>;
  startGame: () => void;
  submitNightAction: (targetId: string) => void;
  submitVote: (targetId: string) => void;
  sendChatMessage: (message: string) => void;
  playAgain: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  gameState: null,
  playerId: null,
  roomCode: null,
  error: null,
  createRoom: async () => null,
  joinRoom: async () => null,
  rejoinRoom: async () => false,
  startGame: () => {},
  submitNightAction: () => {},
  submitVote: () => {},
  sendChatMessage: () => {},
  playAgain: () => {},
  clearError: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('game-state-update', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (playerName: string) => {
    const s = socketRef.current;
    if (!s) return null;
    return new Promise<{ roomCode: string; playerId: string } | null>((resolve) => {
      s.emit('create-room', { playerName }, (response: any) => {
        if (response.error) {
          setError(response.error);
          resolve(null);
        } else {
          setPlayerId(response.playerId);
          setRoomCode(response.roomCode);
          setGameState(response.state);
          resolve({ roomCode: response.roomCode, playerId: response.playerId });
        }
      });
    });
  }, []);

  const joinRoom = useCallback(async (code: string, playerName: string) => {
    const s = socketRef.current;
    if (!s) return null;
    return new Promise<{ roomCode: string; playerId: string } | null>((resolve) => {
      s.emit('join-room', { roomCode: code, playerName }, (response: any) => {
        if (response.error) {
          setError(response.error);
          resolve(null);
        } else {
          setPlayerId(response.playerId);
          setRoomCode(response.roomCode);
          setGameState(response.state);
          resolve({ roomCode: response.roomCode, playerId: response.playerId });
        }
      });
    });
  }, []);

  // Rejoin an existing room after page refresh
  const rejoinRoom = useCallback(async (code: string, pid: string) => {
    const s = socketRef.current;
    if (!s) return false;
    return new Promise<boolean>((resolve) => {
      s.emit('rejoin-room', { roomCode: code, playerId: pid }, (response: any) => {
        if (response.error) {
          console.log('Rejoin failed:', response.error);
          resolve(false);
        } else {
          setPlayerId(response.playerId);
          setRoomCode(response.roomCode);
          setGameState(response.state);
          resolve(true);
        }
      });
    });
  }, []);

  const startGame = useCallback(() => {
    const s = socketRef.current;
    if (!s || !roomCode) return;
    s.emit('start-game', { roomCode }, (response: any) => {
      if (response.error) setError(response.error);
    });
  }, [roomCode]);

  const submitNightAction = useCallback((targetId: string) => {
    const s = socketRef.current;
    if (!s || !roomCode) return;
    s.emit('night-action', { roomCode, targetId }, (response: any) => {
      if (response.error) setError(response.error);
    });
  }, [roomCode]);

  const submitVote = useCallback((targetId: string) => {
    const s = socketRef.current;
    if (!s || !roomCode) return;
    s.emit('day-vote', { roomCode, targetId }, (response: any) => {
      if (response.error) setError(response.error);
    });
  }, [roomCode]);

  const sendChatMessage = useCallback((message: string) => {
    const s = socketRef.current;
    if (!s || !roomCode) return;
    s.emit('chat-message', { roomCode, message });
  }, [roomCode]);

  const playAgain = useCallback(() => {
    const s = socketRef.current;
    if (!s || !roomCode) return;
    s.emit('play-again', { roomCode }, (response: any) => {
      if (response.error) setError(response.error);
    });
  }, [roomCode]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <SocketContext.Provider value={{
      socket, isConnected, gameState, playerId, roomCode, error,
      createRoom, joinRoom, rejoinRoom, startGame, submitNightAction, submitVote,
      sendChatMessage, playAgain, clearError,
    }}>
      {children}
    </SocketContext.Provider>
  );
}
