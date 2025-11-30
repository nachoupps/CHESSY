'use client';

import React, { useState } from 'react';

interface CoordinateInputProps {
    onMove: (from: string, to: string) => void;
}

export const CoordinateInput: React.FC<CoordinateInputProps> = ({ onMove }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Esperamos formato "e2 e4" o "e2e4"
        const cleaned = input.trim().toLowerCase().replace(/\s+/g, '');
        if (cleaned.length === 4) {
            const from = cleaned.substring(0, 2);
            const to = cleaned.substring(2, 4);
            onMove(from, to);
            setInput('');
        } else {
            alert('Formato inválido. Usa "e2e4" o "e2 e4"');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-[75vh]">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e2e4 or e2 e4"
                className="flex-1 bg-black bg-opacity-70 border-2 border-ai-accent border-opacity-50 rounded-lg px-3 py-1.5 text-ai-highlight font-mono focus:outline-none focus:border-ai-accent focus:shadow-[0_0_15px_rgba(0,255,255,0.4)] placeholder-ai-text placeholder-opacity-40 uppercase transition-all text-sm"
            />
            <button type="submit" className="bg-gradient-to-r from-ai-accent to-ai-highlight text-ai-bg px-4 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] active:scale-95 transition-all border-2 border-ai-accent text-sm">
                ⚡ MOVE
            </button>
        </form>
    );
};
