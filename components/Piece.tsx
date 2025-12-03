'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { Piece as ChessPiece } from 'chess.js';
import Image from 'next/image';

interface PieceProps {
    piece: ChessPiece;
    position: string;
    canDrag?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ piece, position, canDrag = true }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'PIECE',
        item: { type: 'PIECE', id: `${piece.color}${piece.type}`, position },
        canDrag: () => canDrag,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [canDrag, piece, position]);

    const pieceImage = `/pieces/${piece.color}${piece.type}.png`; // Asumiremos que tenemos imágenes o usaremos texto por ahora si no las hay.

    // Para este ejemplo rápido, usaré caracteres unicode o imágenes si las tuviera. 
    // Mejor usaré un mapa de SVGs o caracteres por ahora para no depender de assets externos inmediatamente.

    const pieceSymbols: Record<string, string> = {
        p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
        P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
    };

    const symbol = piece.color === 'w' ? pieceSymbols[piece.type.toUpperCase()] : pieceSymbols[piece.type];

    return (
        <div
            ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
            className={`w-full h-full flex items-center justify-center text-4xl cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'} select-none`}
            style={{
                color: piece.color === 'w' ? '#fff' : '#000',
                textShadow: piece.color === 'w' ? '0 0 2px #000' : '0 0 2px #fff' // Contorno para visibilidad
            }}
        >
            {symbol}
        </div>
    );
};
