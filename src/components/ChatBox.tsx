'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/shared/types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatBox({
  messages,
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatBoxProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10">
        <h3 className="text-xs sm:text-sm font-bold text-[#94a1b2] uppercase tracking-wider">💬 Town Chat</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-[150px] sm:min-h-[200px] max-h-[250px] sm:max-h-[300px]">
        {messages.length === 0 && (
          <p className="text-[#94a1b2] text-xs sm:text-sm text-center py-6 sm:py-8">No messages yet. Start the discussion!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fadeIn">
            <span className="font-bold text-xs sm:text-sm" style={{ color: msg.playerColor }}>
              {msg.playerName}:
            </span>{' '}
            <span className="text-xs sm:text-sm text-white/90">{msg.message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-2 sm:p-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? 'Chat disabled' : placeholder}
          disabled={disabled}
          maxLength={200}
          className="input-field flex-1 text-[16px] sm:text-sm py-2"
          style={{ fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="btn-primary py-2 px-3 sm:px-4 text-sm min-w-[48px] min-h-[44px]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
