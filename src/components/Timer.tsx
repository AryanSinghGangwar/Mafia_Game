'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  endTime: number | null;
  className?: string;
}

export default function Timer({ endTime, className = '' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;

  const isUrgent = timeLeft <= 10;
  const percentage = endTime ? Math.min(100, (timeLeft / 60) * 100) : 0;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className={`relative w-10 h-10 sm:w-12 sm:h-12 ${isUrgent ? 'animate-pulse' : ''}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/10"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={isUrgent ? 'text-[#e53170]' : 'text-[#7f5af0]'}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs sm:text-sm font-bold ${isUrgent ? 'text-[#e53170]' : 'text-white'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
}
