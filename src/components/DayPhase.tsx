'use client';

import React from 'react';
import { useSocket } from './SocketProvider';
import PlayerAvatar from './PlayerAvatar';
import Timer from './Timer';
import ChatBox from './ChatBox';

export default function DayPhase() {
  const { gameState, playerId, sendChatMessage } = useSocket();

  if (!gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isAnnouncement = gameState.phase === 'day-announcement';
  const nightResults = (gameState as any).nightResults;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <span className="text-3xl sm:text-4xl">☀️</span>
          <h1 className="text-2xl sm:text-3xl font-black">
            {isAnnouncement ? 'Dawn' : 'Town Meeting'}
          </h1>
          <span className="text-xs sm:text-sm text-[#94a1b2]">Day {gameState.round}</span>
        </div>
        <Timer endTime={gameState.phaseEndTime} />
      </div>

      {/* Night Results Announcement */}
      {isAnnouncement && nightResults && (
        <div className="glass-panel p-6 sm:p-8 text-center animate-slideUp border-[#7f5af0]/30 border-2">
          <div className="text-sm font-bold text-[#7f5af0] uppercase tracking-widest mb-4">🎤 Moderator Summary</div>
          
          <div className="text-lg sm:text-xl leading-relaxed text-[#fffffe] italic mb-6">
            "
            {nightResults.killed && (
              <>The Mafia attacked <span className="text-[#e53170] font-bold">{nightResults.killed.name}</span> last night. Tragically, the Doctor was not there to save them. {nightResults.killed.name} has died, and was revealed to be a <span className="font-bold">{nightResults.killed.role}</span>. </>
            )}
            {nightResults.saved && nightResults.savedPlayer && (
              <>The Mafia attacked <span className="text-[#2cb67d] font-bold">{nightResults.savedPlayer}</span> last night, but the Doctor arrived just in time to save them! <span className="text-[#2cb67d] font-bold">{nightResults.savedPlayer}</span> survived the attack. </>
            )}
            {!nightResults.killed && !nightResults.saved && (
              <>It was a peaceful night. The Mafia chose to sleep and no one was attacked. </>
            )}
            
            {/* Sheriff flavor text */}
            {gameState.players.some(p => p.role === 'sheriff' && p.isAlive) ? (
              <>Meanwhile, the Sheriff was out patrolling the streets in secret, gathering clues... </>
            ) : (
               <>Without a Sheriff to patrol the streets, the town must rely on their own wits... </>
            )}
            "
          </div>

          {nightResults.killed && (
            <div className="flex justify-center mt-4">
              <PlayerAvatar
                color={gameState.players.find(p => p.id === nightResults.killed.id)?.color || '#666'}
                name={nightResults.killed.name}
                isAlive={false}
                size="lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Investigation result (for sheriff only) */}
      {nightResults?.investigated && currentPlayer?.role === 'sheriff' && currentPlayer.isAlive && (
        <div className={`glass-panel p-3 sm:p-4 text-center ${
          nightResults.investigated.isMafia ? 'border-[#e53170]/50' : 'border-[#2cb67d]/50'
        }`}>
          <p className="text-xs sm:text-sm text-[#94a1b2] mb-2">🔍 Your private investigation notes:</p>
          <p className={`font-bold text-sm sm:text-base ${
            nightResults.investigated.targetDied ? 'text-[#ff8906]' : nightResults.investigated.isMafia ? 'text-[#e53170]' : 'text-[#2cb67d]'
          }`}>
            {nightResults.investigated.targetDied
              ? `⚖️ Sheriff could not do anything as always law is blind "Kanoon andha hai judge shaab". Your target was murdered!`
              : nightResults.investigated.isMafia 
                ? `🎯 Your instincts are sharp! You are thinking in the exact right direction about ${nightResults.investigated.playerName}...` 
                : `🕵️‍♂️ You spent all night spying on ${nightResults.investigated.playerName}, but they just aggressively ate a midnight snack and went back to bed. Completely innocent!`}
          </p>
        </div>
      )}

      {/* Player Grid & Chat — stacked on mobile, side by side on desktop */}
      {!isAnnouncement && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Players */}
          <div className="glass-panel p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-bold text-[#94a1b2] uppercase tracking-wider mb-2 sm:mb-3">Players</h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
              {gameState.players.map((player) => (
                <PlayerAvatar
                  key={player.id}
                  color={player.color}
                  name={player.name}
                  isAlive={player.isAlive}
                  size="sm"
                  isConnected={player.isConnected}
                />
              ))}
            </div>
          </div>

          {/* Chat */}
          <ChatBox
            messages={gameState.chat}
            onSendMessage={sendChatMessage}
            disabled={!currentPlayer?.isAlive}
            placeholder={currentPlayer?.isAlive ? 'Discuss your suspicions...' : 'You are dead. Spectating...'}
          />
        </div>
      )}
    </div>
  );
}
