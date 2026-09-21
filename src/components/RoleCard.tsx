'use client';

import React, { useState, useEffect } from 'react';
import { ROLE_INFO } from '@/shared/constants';
import { Role } from '@/shared/types';

interface RoleCardProps {
  role: Role;
  show?: boolean;
}

export default function RoleCard({ role, show = true }: RoleCardProps) {
  const [revealed, setRevealed] = useState(false);
  const info = ROLE_INFO[role];

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setRevealed(true), 500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!info) return null;

  const isMafia = role === 'mafia';

  return (
    <div className="flex flex-col items-center gap-4 animate-slideUp">
      <div
        className={`w-64 h-80 rounded-2xl p-6 flex flex-col items-center justify-center gap-4
          transition-all duration-700 transform
          ${revealed ? 'rotate-0 scale-100' : 'rotate-y-180 scale-90'}
          ${isMafia
            ? 'bg-gradient-to-br from-[#e53170]/20 to-[#0f0e17] border-2 border-[#e53170]/50'
            : 'bg-gradient-to-br from-[#2cb67d]/20 to-[#0f0e17] border-2 border-[#2cb67d]/50'
          }`}
      >
        <div className="text-6xl">{info.emoji}</div>
        <h2 className={`text-2xl font-bold ${isMafia ? 'text-[#e53170]' : 'text-[#2cb67d]'}`}>
          {info.name}
        </h2>
        <div className={`text-sm font-medium px-3 py-1 rounded-full
          ${isMafia ? 'bg-[#e53170]/20 text-[#e53170]' : 'bg-[#2cb67d]/20 text-[#2cb67d]'}`}>
          {info.alignment}
        </div>
        <p className="text-center text-sm text-[#94a1b2] leading-relaxed">
          {info.description}
        </p>
      </div>
    </div>
  );
}
