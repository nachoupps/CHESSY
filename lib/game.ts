import { Chess, Move } from 'chess.js';

export class Game {
    private chess: Chess;

    constructor(fen?: string) {
        this.chess = new Chess(fen);
    }

    get fen() {
        return this.chess.fen();
    }

    get turn() {
        return this.chess.turn();
    }

    get isGameOver() {
        return this.chess.isGameOver();
    }

    get isCheck() {
        return this.chess.inCheck();
    }

    get isCheckmate() {
        return this.chess.isCheckmate();
    }

    get isDraw() {
        return this.chess.isDraw();
    }

    move(from: string, to: string, promotion: string = 'q'): Move | null {
        try {
            return this.chess.move({ from, to, promotion });
        } catch (e) {
            return null;
        }
    }

    reset() {
        this.chess.reset();
    }

    undo() {
        return this.chess.undo();
    }

    history() {
        return this.chess.history();
    }

    moves() {
        return this.chess.moves();
    }

    getPiece(square: string) {
        return this.chess.get(square as any);
    }

    board() {
        return this.chess.board();
    }
}
