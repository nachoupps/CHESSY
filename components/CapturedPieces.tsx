'use client';

import React from 'react';

interface CapturedPiecesProps {
    captured: string[]; // Array de tipos de piezas capturadas (p, n, b, r, q)
    color: 'w' | 'b';
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ captured, color }) => {
    const pieceSymbols: Record<string, string> = {
        p: '♟', r: '♜', n: '♞', b: '♝', q: '♛',
        P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕'
    };

    // Mapear piezas a símbolos. Si color es 'w', mostramos piezas negras capturadas, y viceversa.
    // Pero chess.js suele dar las piezas capturadas tal cual.
    // Asumiremos que 'captured' contiene los tipos de piezas (p, n, etc.)

    return (
        <div className="flex gap-1 text-2xl h-8 items-center">
            {captured.map((piece, index) => (
                <span key={index} style={{ color: color === 'w' ? '#00ffff' : '#ff00ff' }} className="drop-shadow-[0_0_8px_currentColor]">
                    {pieceSymbols[color === 'w' ? piece.toUpperCase() : piece]}
                    {/* Ajuste: si soy blanco, capturé negras (minúsculas), quiero mostrarlas como negras o blancas? 
              Normalmente se muestran las piezas del color del oponente que has capturado.
              Si soy blanco, muestro peones negros capturados.
          */}
                </span>
            ))}
        </div>
    );
};
