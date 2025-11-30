'use client';

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Board } from '@/components/Board';
import { Dashboard } from '@/components/Dashboard';
import { SavedGame } from '@/lib/storage';

export default function Home() {
  const [currentGame, setCurrentGame] = useState<SavedGame | null>(null);

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-ai-bg relative z-10">
        <h1 className="text-6xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-ai-accent via-ai-highlight to-ai-accent animate-[gradient-shift_3s_ease_infinite] tracking-wider drop-shadow-[0_0_30px_rgba(0,255,255,0.8)]" style={{ backgroundSize: '200% 200%' }}>
          CHESSY
        </h1>

        {currentGame ? (
          <Board
            savedGame={currentGame}
            onBack={() => setCurrentGame(null)}
          />
        ) : (
          <Dashboard onSelectGame={setCurrentGame} />
        )}
      </main>
    </DndProvider>
  );
}
