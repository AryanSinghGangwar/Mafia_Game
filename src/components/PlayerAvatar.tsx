'use client';

import React from 'react';

interface PlayerAvatarProps {
  color: string;
  name: string;
  isAlive: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  isConnected?: boolean;
}

export default function PlayerAvatar({
  color,
  name,
  isAlive,
  isSelected = false,
  onClick,
  size = 'md',
  showName = true,
  isConnected = true,
}: PlayerAvatarProps) {
  const sizes = {
    sm: { body: 'w-10 h-12', visor: 'w-5 h-3', text: 'text-[10px] sm:text-xs', touch: 'min-w-[48px] min-h-[48px]' },
    md: { body: 'w-12 h-14 sm:w-14 sm:h-16', visor: 'w-6 h-3 sm:w-7 sm:h-4', text: 'text-xs sm:text-sm', touch: 'min-w-[56px] min-h-[56px]' },
    lg: { body: 'w-16 h-20 sm:w-20 sm:h-24', visor: 'w-8 h-5 sm:w-10 sm:h-6', text: 'text-sm sm:text-base', touch: 'min-w-[72px] min-h-[72px]' },
  };

  const s = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${s.touch}
        ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
        ${isSelected ? 'scale-110' : ''}
        ${!isConnected ? 'opacity-40' : ''}`}
    >
      <div className="relative">
        {/* Body */}
        <div
          className={`${s.body} rounded-t-[50%] rounded-b-lg relative transition-all duration-300
            ${!isAlive ? 'opacity-40 grayscale' : ''}
            ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0e17]' : ''}`}
          style={{ backgroundColor: color }}
        >
          {/* Visor */}
          <div
            className={`${s.visor} absolute top-[25%] right-[10%] rounded-l-full
              bg-[#c6e8ff] border-2 border-[#89cff0]/50`}
            style={{ boxShadow: 'inset 0 0 4px rgba(137, 207, 240, 0.5)' }}
          />
          {/* Backpack */}
          <div
            className="absolute left-[-15%] top-[30%] w-[20%] h-[35%] rounded-l-lg"
            style={{ backgroundColor: color, filter: 'brightness(0.7)' }}
          />
        </div>
        {/* Ghost overlay for dead players */}
        {!isAlive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl sm:text-2xl">👻</span>
          </div>
        )}
      </div>
      {showName && (
        <span className={`${s.text} font-medium truncate max-w-[60px] sm:max-w-[80px] text-center
          ${!isAlive ? 'line-through text-gray-500' : 'text-white'}`}>
          {name}
        </span>
      )}
    </button>
  );
}
