
// Database of chess openings
export interface Opening {
    name: string;
    moves: string[];
    eco?: string; // Encyclopedia of Chess Openings code
    description?: string;
}

export const OPENINGS: Opening[] = [
    // King's Pawn Openings
    { name: "Italian Game", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"], eco: "C50", description: "Control central y desarrollo rápido de piezas menores." },
    { name: "Ruy López / Spanish Opening", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"], eco: "C60", description: "Una de las aperturas más antiguas y analizadas, lucha por el centro." },
    { name: "Sicilian Defense", moves: ["e4", "c5"], eco: "B20", description: "Defensa agresiva y popular para las negras, lucha por la casilla d4." },
    { name: "French Defense", moves: ["e4", "e6"], eco: "C00", description: "Sólida y posicional, las negras contraatacan en el centro más tarde." },
    { name: "Caro-Kann Defense", moves: ["e4", "c6"], eco: "B10", description: "Muy sólida, similar a la Francesa pero el alfil de casillas claras no queda atrapado." },
    { name: "Scandinavian Defense", moves: ["e4", "d5"], eco: "B01", description: "Desafío inmediato al centro, lleva a posiciones abiertas." },
    { name: "Four Knights Game", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"], eco: "C47", description: "Desarrollo tranquilo y simétrico de los caballos." },
    { name: "Scotch Game", moves: ["e4", "e5", "Nf3", "Nc6", "d4"], eco: "C45", description: "Apertura abierta que busca abrir líneas rápidamente." },
    { name: "King's Gambit", moves: ["e4", "e5", "f4"], eco: "C30", description: "Agresiva y romántica, sacrifica un peón por ataque y desarrollo." },
    { name: "Petrov's Defense", moves: ["e4", "e5", "Nf3", "Nf6"], eco: "C42", description: "Sólida defensa de contraataque, evita la Ruy López." },
    { name: "Pirc Defense", moves: ["e4", "d6"], eco: "B07", description: "Hipermoderna, permite a las blancas ocupar el centro para luego atacarlo." },

    // Queen's Pawn Openings
    { name: "Queen's Gambit", moves: ["d4", "d5", "c4"], eco: "D06", description: "Lucha por el control central sacrificando temporalmente un peón." },
    { name: "Queen's Gambit Accepted", moves: ["d4", "d5", "c4", "dxc4"], eco: "D20", description: "Las negras aceptan el peón pero ceden el centro temporalmente." },
    { name: "Queen's Gambit Declined", moves: ["d4", "d5", "c4", "e6"], eco: "D30", description: "Sólida defensa manteniendo un fuerte punto en d5." },
    { name: "Slav Defense", moves: ["d4", "d5", "c4", "c6"], eco: "D10", description: "Sólida alternativa al Gambito de Dama Rehusado, soporta d5 con c6." },
    { name: "King's Indian Defense", moves: ["d4", "Nf6", "c4", "g6"], eco: "E60", description: "Dinámica y compleja, las negras permiten centro blanco para atacar luego." },
    { name: "Nimzo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"], eco: "E20", description: "Controla e4 clavando el caballo, muy respetada." },
    { name: "Grünfeld Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"], eco: "D70", description: "Hipermoderna, combina fianchetto con golpe central d5." },
    { name: "Dutch Defense", moves: ["d4", "f5"], eco: "A80", description: "Agresiva, busca controlar e4 y atacar en el flanco de rey." },
    { name: "Benoni Defense", moves: ["d4", "Nf6", "c4", "c5"], eco: "A56", description: "Crea desequilibrios inmediatos y mayorías de peones." },
    { name: "Bogo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+"], eco: "E11", description: "Sólida alternativa a la Nimzo-India." },

    // Flank Openings
    { name: "English Opening", moves: ["c4"], eco: "A10", description: "Flexible y posicional, controla d5 desde el flanco." },
    { name: "Réti Opening", moves: ["Nf3"], eco: "A04", description: "Hipermoderna, controla el centro a distancia." },
    { name: "Bird's Opening", moves: ["f4"], eco: "A02", description: "Apertura de flanco agresiva, imagen especular de la Holandesa." },

    // Semi-Open Games
    { name: "Alekhine's Defense", moves: ["e4", "Nf6"], eco: "B02", description: "Provoca el avance de peones blancos para atacarlos luego." },
    { name: "Modern Defense", moves: ["e4", "g6"], eco: "B06", description: "Flexible, permite a las blancas el centro para minarlo después." },
];

/**
 * Detects if the current move sequence matches a known opening
 * @param moves Array of moves in algebraic notation
 * @returns The opening if detected, null otherwise
 */
export function detectOpening(moves: string[]): Opening | null {
    if (moves.length === 0) return null;

    // Sort openings by length (longest first) to match the most specific opening
    const sortedOpenings = [...OPENINGS].sort((a, b) => b.moves.length - a.moves.length);

    for (const opening of sortedOpenings) {
        if (opening.moves.length > moves.length) continue;

        // Check if all opening moves match the played moves
        const match = opening.moves.every((move, index) => {
            return moves[index] === move;
        });

        if (match) {
            return opening;
        }
    }

    return null;
}
