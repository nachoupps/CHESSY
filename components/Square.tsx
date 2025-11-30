'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { Piece } from './Piece';
import { Piece as ChessPiece } from 'chess.js';
import clsx from 'clsx';

interface SquareProps {
    position: string;
    piece: ChessPiece | null;
    isBlack: boolean;
    onDrop: (from: string, to: string) => void;
}

export const Square: React.FC<SquareProps> = ({ position, piece, isBlack, onDrop }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'PIECE',
        drop: (item: { position: string }) => onDrop(item.position, position),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div
            ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
            className={clsx(
                'w-full h-full flex items-center justify-center relative transition-all duration-300',
                isBlack ? 'bg-[#1e2449]' : 'bg-[#2a3166]',
                isOver && canDrop && 'bg-[#00ffff] bg-opacity-30 shadow-[inset_0_0_20px_rgba(0,255,255,0.5)]'
            )}
        >
            {piece && <Piece piece={piece} position={position} />}
        </div>
    );
};
