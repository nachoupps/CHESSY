'use client';

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Board } from '@/components/Board';
import { Dashboard } from '@/components/Dashboard';
import { SavedGame } from '@/lib/storage';

export default function Home() {
  const [currentGame, setCurrentGame] = useState<SavedGame | null>(null);
  const [userRole, setUserRole] = useState<'w' | 'b' | 'spectator'>('spectator');

  const handleSelectGame = (game: SavedGame, role?: 'w' | 'b' | 'spectator') => {
    setCurrentGame(game);
    setUserRole(role || 'spectator');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-ai-bg relative z-10">
        <h1 className="text-6xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-ai-accent via-ai-highlight to-ai-accent animate-[gradient-shift_3s_ease_infinite] tracking-wider drop-shadow-[0_0_30px_rgba(0,255,255,0.8)] flex items-end" style={{ backgroundSize: '200% 200%' }}>
          CHESS
          <div className="relative inline-block">
            Y
            {/* Antenna Broadcasting */}
            <div className="absolute bottom-[75%] left-1/2 -translate-x-1/2 flex flex-col items-center">
              {/* Version Tag */}
              <div className="mb-1 bg-black/80 border border-ai-highlight px-1.5 py-0.5 rounded text-[8px] font-mono text-ai-highlight whitespace-nowrap shadow-[0_0_10px_rgba(0,255,255,0.8)] animate-pulse">
                v2.3
              </div>
              {/* Antenna Stem */}
              <div className="w-0.5 h-4 bg-ai-highlight shadow-[0_0_5px_rgba(0,255,255,0.8)]"></div>
              {/* Signal Waves */}
              <div className="absolute bottom-2 w-8 h-8 border-t-2 border-ai-highlight rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50"></div>
              <div className="absolute bottom-2 w-12 h-12 border-t-2 border-ai-highlight rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s] opacity-30"></div>
            </div>
          </div>
        </h1>

        {currentGame ? (
          <Board
            savedGame={currentGame}
            userRole={userRole}
            onBack={() => setCurrentGame(null)}
          />
        ) : (
          <Dashboard onSelectGame={handleSelectGame} />
        )}
      </main>
    </DndProvider>
  );
}
