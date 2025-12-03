'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Game } from '@/lib/game';
import { Square } from './Square';
import { CoordinateInput } from './CoordinateInput';
import { SavedGame, saveGame, updatePlayerStats, getPlayers, getGame } from '@/lib/storage';
import { CapturedPieces } from './CapturedPieces';
import { OpeningBot } from './OpeningBot';
import { detectOpening, Opening } from '@/lib/openings';

interface BoardProps {
    savedGame: SavedGame;
    onBack: () => void;
}

export const Board: React.FC<BoardProps> = ({ savedGame, onBack }) => {
    const [game, setGame] = useState(() => new Game(savedGame.fen));
    const [fen, setFen] = useState(game.fen);
    const [history, setHistory] = useState<string[]>(game.history());
    const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
    const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
    const [isResetConfirming, setIsResetConfirming] = useState(false);
    const [isResignConfirming, setIsResignConfirming] = useState(false);
    const [isDrawConfirming, setIsDrawConfirming] = useState(false);
    const [gameResult, setGameResult] = useState<string | null>(savedGame.winner ? (savedGame.winner === 'draw' ? 'EMPATE' : `VICTORIA: ${savedGame.winner === 'w' ? savedGame.whitePlayer : savedGame.blackPlayer}`) : null);
    const [detectedOpening, setDetectedOpening] = useState<Opening | null>(null);

    // Calcular material capturado
    const calculateCaptured = useCallback(() => {
        const board = game.board(); // Necesitamos acceso al board 2D o contar piezas
        // game.ts no expone board() directamente, pero podemos usar fen.
        // Una forma más fácil es contar lo que hay en el tablero y restar del set inicial.

        const initialCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
        const currentWhite = { p: 0, n: 0, b: 0, r: 0, q: 0 };
        const currentBlack = { p: 0, n: 0, b: 0, r: 0, q: 0 };

        // Iterar FEN es más robusto que board() si no lo tenemos expuesto
        const fenBoard = game.fen.split(' ')[0];
        for (const char of fenBoard) {
            if (['P', 'N', 'B', 'R', 'Q'].includes(char)) currentWhite[char.toLowerCase() as keyof typeof currentWhite]++;
            if (['p', 'n', 'b', 'r', 'q'].includes(char)) currentBlack[char as keyof typeof currentBlack]++;
        }

        const capW: string[] = []; // Piezas negras capturadas por blancas
        const capB: string[] = []; // Piezas blancas capturadas por negras

        (['p', 'n', 'b', 'r', 'q'] as const).forEach(type => {
            const diffW = initialCounts[type] - currentWhite[type];
            const diffB = initialCounts[type] - currentBlack[type];
            for (let i = 0; i < diffB; i++) capW.push(type); // Blancas capturaron negras
            for (let i = 0; i < diffW; i++) capB.push(type.toUpperCase()); // Negras capturaron blancas
        });

        setCapturedWhite(capW);
        setCapturedBlack(capB);
    }, [game]);

    const concludeGame = useCallback(async (winner: 'w' | 'b' | 'draw', resultText: string) => {
        // Get player IDs
        const players = await getPlayers();
        const whitePlayerId = players.find(p => p.name === savedGame.whitePlayer)?.id;
        const blackPlayerId = players.find(p => p.name === savedGame.blackPlayer)?.id;

        // Update ELO only if Normal Mode (Ranked) and players exist
        if ((savedGame.mode === 'normal' || !savedGame.mode) && whitePlayerId && blackPlayerId) {
            if (winner === 'w') {
                await updatePlayerStats(whitePlayerId, 'win', 10);
                await updatePlayerStats(blackPlayerId, 'loss', -5);
            } else if (winner === 'b') {
                await updatePlayerStats(blackPlayerId, 'win', 10);
                await updatePlayerStats(whitePlayerId, 'loss', -5);
            } else {
                await updatePlayerStats(whitePlayerId, 'draw', 2);
                await updatePlayerStats(blackPlayerId, 'draw', 2);
            }
        }

        // Save Game Result
        const updatedGame = {
            ...savedGame,
            fen: game.fen,
            lastUpdated: Date.now(),
            winner
        };
        await saveGame(updatedGame);
        setGameResult(resultText);
        alert(`JUEGO TERMINADO: ${resultText}`);
    }, [game, savedGame]);

    // Check for Game Over
    const checkGameOver = useCallback(() => {
        if (savedGame.winner) return; // Already finished

        if (game.isGameOver) {
            let winner: 'w' | 'b' | 'draw' = 'draw';
            let resultText = 'EMPATE';

            if (game.isCheckmate) {
                winner = game.turn === 'w' ? 'b' : 'w'; // Turn is of the loser
                resultText = `VICTORIA: ${winner === 'w' ? savedGame.whitePlayer : savedGame.blackPlayer}`;
            } else if (game.isDraw) {
                winner = 'draw';
                resultText = 'EMPATE';
            }
            concludeGame(winner, resultText);
        }
    }, [game, savedGame, concludeGame]);

    const lastInteraction = React.useRef<number>(0);

    // Forzar re-render cuando cambia el estado del juego
    const updateGame = useCallback(async () => {
        const newFen = game.fen;
        setFen(newFen);
        setHistory(game.history());
        calculateCaptured();
        lastInteraction.current = Date.now();

        // Detect opening
        const currentMoves = game.history();
        const opening = detectOpening(currentMoves);
        if (opening && currentMoves.length <= 10) {
            setDetectedOpening(opening);
        } else if (currentMoves.length > 10) {
            setDetectedOpening(null);
        }

        // Guardar estado si no ha terminado
        if (!savedGame.winner) {
            await saveGame({
                ...savedGame,
                fen: newFen,
                lastUpdated: Date.now()
            });
        }

        checkGameOver();
    }, [game, savedGame, calculateCaptured, checkGameOver, setDetectedOpening]);

    useEffect(() => {
        calculateCaptured();
    }, [calculateCaptured]);

    // Polling for game updates
    useEffect(() => {
        if (savedGame.winner) return; // Don't poll if game is finished

        const interval = setInterval(async () => {
            // Skip polling if we just interacted (prevents overwriting our own move before it saves)
            if (Date.now() - lastInteraction.current < 3000) return;

            const latestGame = await getGame(savedGame.id);
            if (latestGame && latestGame.fen !== game.fen) {
                // Update local game state if FEN has changed (opponent moved)
                const newGame = new Game(latestGame.fen);
                setGame(newGame);
                setFen(latestGame.fen);
                setHistory(newGame.history());

                // Update other states
                if (latestGame.winner) {
                    setGameResult(latestGame.winner === 'draw' ? 'EMPATE' : `VICTORIA: ${latestGame.winner === 'w' ? latestGame.whitePlayer : latestGame.blackPlayer}`);
                    alert(`JUEGO ACTUALIZADO: ${latestGame.winner === 'draw' ? 'EMPATE' : 'VICTORIA'}`);
                }
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [savedGame.id, savedGame.winner, game.fen]);

    const onDrop = (from: string, to: string) => {
        const move = game.move(from, to);
        if (move) {
            updateGame();
        }
    };

    const onCoordinateMove = (from: string, to: string) => {
        const move = game.move(from, to);
        if (move) {
            updateGame();
        } else {
            alert('Movimiento inválido');
        }
    }

    const resetGame = () => {
        game.reset();
        updateGame();
        setIsResetConfirming(false);
    };

    const handleResign = () => {
        const loser = game.turn;
        const winner = loser === 'w' ? 'b' : 'w';
        const resultText = `VICTORIA (RENDICION): ${winner === 'w' ? savedGame.whitePlayer : savedGame.blackPlayer}`;
        concludeGame(winner, resultText);
        setIsResignConfirming(false);
    };

    const handleDraw = () => {
        concludeGame('draw', 'EMPATE (ACORDADO)');
        setIsDrawConfirming(false);
    };

    // Generar el tablero
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <div className="flex flex-col xl:flex-row items-center justify-center gap-4 w-full min-h-screen bg-ai-bg p-3 text-ai-text relative z-10 overflow-hidden">

            {/* Left Column: Board and Coordinate Input */}
            <div className="flex flex-col items-center gap-3">
                {/* Board with external coordinates */}
                <div className="relative py-6 px-8">
                    {/* Left rank numbers (8-1) */}
                    <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-around text-ai-accent font-bold text-base">
                        {['8', '7', '6', '5', '4', '3', '2', '1'].map(rank => (
                            <div key={rank} className="drop-shadow-[0_0_5px_currentColor]">{rank}</div>
                        ))}
                    </div>

                    {/* Right rank numbers (8-1) - mirror */}
                    <div className="absolute right-0 top-6 bottom-6 flex flex-col justify-around text-ai-accent font-bold text-base">
                        {['8', '7', '6', '5', '4', '3', '2', '1'].map(rank => (
                            <div key={rank} className="drop-shadow-[0_0_5px_currentColor]">{rank}</div>
                        ))}
                    </div>

                    {/* Board */}
                    <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full min-h-[75vh] max-w-[75vh] border-4 border-ai-accent shadow-[0_0_30px_rgba(0,255,255,0.3),inset_0_0_30px_rgba(0,255,255,0.1)] bg-gradient-to-br from-ai-panel to-ai-bg rounded-lg overflow-hidden relative">
                        {/* Animated border glow */}
                        <div className="absolute inset-0 rounded-lg animate-[glow-pulse_3s_ease-in-out_infinite] pointer-events-none"></div>
                        {ranks.map((rank, rIndex) =>
                            files.map((file, fIndex) => {
                                const square = `${file}${rank}`;
                                return (
                                    <SquareWrapper
                                        key={square}
                                        game={game}
                                        square={square}
                                        isBlack={(rIndex + fIndex) % 2 === 1}
                                        onDrop={onDrop}
                                        fen={fen}
                                    />
                                );
                            })
                        )}
                    </div>

                    {/* Bottom file letters (a-h) */}
                    <div className="absolute bottom-0 left-8 right-8 flex justify-around text-ai-accent font-bold text-base">
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                            <div key={file} className="drop-shadow-[0_0_5px_currentColor]">{file}</div>
                        ))}
                    </div>
                </div>
                <CoordinateInput onMove={onCoordinateMove} />
            </div>

            {/* Right Column: Info Panel */}
            <div className="flex flex-col gap-2 w-full max-w-[220px]">

                {/* Black Player Info */}
                <div className="bg-gradient-to-br from-ai-panel to-ai-bg p-2 border border-ai-accent shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-md backdrop-blur-sm">
                    <span className="font-bold text-sm uppercase tracking-widest mb-1 border-b border-slate-600 pb-1 block text-ai-text">
                        {savedGame.blackPlayer || 'NEGRAS'}
                    </span>
                    <CapturedPieces captured={capturedBlack} color="w" />
                </div>

                {/* White Player Info */}
                <div className="bg-gradient-to-br from-ai-panel to-ai-bg p-2 border border-ai-accent shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-md backdrop-blur-sm">
                    <span className="font-bold text-sm uppercase tracking-widest mb-1 border-b border-slate-600 pb-1 block text-ai-text">
                        {savedGame.whitePlayer || 'BLANCAS'}
                    </span>
                    <CapturedPieces captured={capturedWhite} color="b" />
                </div>

                {/* Opening Detection Bot */}
                {detectedOpening && (
                    <OpeningBot
                        openingName={detectedOpening.name}
                        eco={detectedOpening.eco}
                        description={detectedOpening.description}
                    />
                )}

                {/* Turn Indicator */}
                <div className="text-[9px] text-ai-text uppercase tracking-widest bg-gradient-to-r from-ai-panel to-ai-bg px-2 py-1.5 border border-ai-accent shadow-[0_0_10px_rgba(0,255,255,0.3)] text-center rounded-md">
                    TURNO: <span className="font-bold text-ai-highlight">{game.turn === 'w' ? 'BLANCAS' : 'NEGRAS'}</span>
                </div>

                {/* Game Controls */}
                <div className="flex flex-col gap-1">
                    {/* Resign Button */}
                    {isResignConfirming ? (
                        <div className="flex gap-1">
                            <button onClick={handleResign} className="flex-1 px-1.5 py-0.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold uppercase tracking-wider border border-red-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] text-[9px] animate-pulse rounded">
                                ¿RENDIRSE?
                            </button>
                            <button onClick={() => setIsResignConfirming(false)} className="flex-1 px-1.5 py-0.5 bg-slate-500 text-white font-bold uppercase tracking-wider border border-slate-700 hover:bg-slate-400 text-[9px] rounded">
                                NO
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsResignConfirming(true)} disabled={!!savedGame.winner} className="w-full px-2 py-1 bg-gradient-to-r from-orange-700 to-red-700 text-white font-bold uppercase tracking-wider border border-orange-500 hover:shadow-[0_0_10px_rgba(255,127,0,0.3)] transition-all text-[9px] disabled:opacity-30 disabled:cursor-not-allowed rounded">
                            🏳 RENDIRSE
                        </button>
                    )}

                    {/* Draw Button */}
                    {isDrawConfirming ? (
                        <div className="flex gap-1">
                            <button onClick={handleDraw} className="flex-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold uppercase tracking-wider border border-yellow-500 hover:shadow-[0_0_10px_rgba(255,255,0,0.3)] text-[9px] animate-pulse rounded">
                                ¿TABLAS?
                            </button>
                            <button onClick={() => setIsDrawConfirming(false)} className="flex-1 px-1.5 py-0.5 bg-slate-500 text-white font-bold uppercase tracking-wider border border-slate-700 hover:bg-slate-400 text-[9px] rounded">
                                NO
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsDrawConfirming(true)} disabled={!!savedGame.winner} className="w-full px-2 py-1 bg-gradient-to-r from-yellow-700 to-yellow-800 text-white font-bold uppercase tracking-wider border border-yellow-500 hover:shadow-[0_0_10px_rgba(255,255,0,0.3)] transition-all text-[9px] disabled:opacity-30 disabled:cursor-not-allowed rounded">
                            🤝 TABLAS
                        </button>
                    )}

                    {/* Reset Button */}
                    {isResetConfirming ? (
                        <div className="flex gap-1">
                            <button onClick={resetGame} className="flex-1 px-1.5 py-0.5 bg-gradient-to-r from-ai-accent to-ai-highlight text-white font-bold uppercase tracking-wider border border-ai-accent hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] text-[9px] animate-pulse rounded">
                                ¿REINICIAR?
                            </button>
                            <button onClick={() => setIsResetConfirming(false)} className="flex-1 px-1.5 py-0.5 bg-slate-500 text-white font-bold uppercase tracking-wider border border-slate-700 hover:bg-slate-400 text-[9px] rounded">
                                NO
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsResetConfirming(true)} className="w-full px-2 py-1 bg-gradient-to-r from-ai-accent to-ai-highlight text-ai-bg font-bold uppercase tracking-wider border border-ai-accent hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all text-[9px] rounded">
                            REINICIAR
                        </button>
                    )}

                    <button onClick={onBack} className="w-full px-2 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 text-ai-accent font-bold uppercase tracking-wider border border-ai-accent hover:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all text-[10px] rounded">
                        ← VOLVER
                    </button>

                    {/* Emergency Undo Button */}
                    {!savedGame.undoUsed && !savedGame.winner && history.length > 0 && (
                        <button
                            onClick={async () => {
                                if (confirm('⚠ EMERGENCY UNDO: Solo puedes usar esto UNA VEZ por partida. ¿Retroceder el último movimiento?')) {
                                    game.undo(); // Undo last move

                                    // Update game state
                                    const newFen = game.fen;
                                    setFen(newFen);
                                    setHistory(game.history());
                                    calculateCaptured();

                                    // Save with undoUsed flag
                                    const updatedGame = {
                                        ...savedGame,
                                        fen: newFen,
                                        lastUpdated: Date.now(),
                                        undoUsed: true
                                    };
                                    await saveGame(updatedGame);

                                    // Force update parent state if needed (though Board uses local savedGame prop, we might need to reload page or update prop? 
                                    // Actually, Board receives savedGame as prop, but we are mutating local state mostly. 
                                    // Ideally we should update the prop or local state that reflects savedGame.
                                    // Since we don't have a setSavedGame prop, we rely on the fact that we just saved it to storage.
                                    // But for UI to update immediately (disable button), we need to reflect that.
                                    // We can't mutate props. We might need a local state for undoUsed if we want immediate feedback without reload.
                                    // However, let's just reload the page or rely on parent re-render? 
                                    // Better: The parent Dashboard passes savedGame. If we update storage, parent doesn't know.
                                    // Let's reload the page to be safe and simple, or just accept that it might not update until next interaction?
                                    // Actually, let's just force a reload for now to ensure consistency, or better, just hide the button locally.
                                    window.location.reload();
                                }
                            }}
                            className="w-full px-2 py-1.5 bg-gradient-to-r from-purple-700 to-pink-700 text-white font-bold uppercase tracking-wider border border-purple-500 hover:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all text-[10px] rounded animate-pulse mt-1"
                        >
                            ⏪ EMERGENCY UNDO (1 LEFT)
                        </button>
                    )}
                </div>

                {/* Log */}
                <div className="w-full bg-gradient-to-br from-ai-panel to-ai-bg p-2 border border-ai-accent shadow-[0_0_10px_rgba(0,255,255,0.2)] rounded-md backdrop-blur-sm">
                    <h3 className="font-bold mb-1 text-[9px] text-ai-highlight uppercase tracking-widest border-b border-ai-accent pb-0.5">📡 LOG:</h3>
                    <div className="text-[9px] break-words text-ai-accent font-mono h-20 overflow-y-auto p-1.5 bg-black bg-opacity-50 rounded border border-ai-accent border-opacity-30">
                        {history.map((move, i) => (
                            <span key={i} className="mr-2">{i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{move}</span>
                        ))}
                    </div>
                </div>

                {/* Simulation / Learning Panels */}
                {savedGame.mode === 'simulation' && !savedGame.winner && (
                    <div className="w-full bg-gradient-to-br from-purple-900/80 to-ai-bg p-2 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-md backdrop-blur-sm animate-pulse">
                        <h3 className="font-bold mb-1 text-[9px] text-purple-300 uppercase tracking-widest border-b border-purple-500 pb-0.5">🔮 AI PREDICTION:</h3>
                        <div className="text-[10px] text-purple-200 font-mono p-1">
                            ANALYZING OPPONENT...
                            <div className="text-xs font-bold mt-1 text-white">
                                {game.moves().length > 0 ? `SUGGESTED: ${game.moves()[Math.floor(Math.random() * game.moves().length)]}` : 'NO MOVES'}
                            </div>
                        </div>
                    </div>
                )}

                {savedGame.mode === 'learning' && !savedGame.winner && (
                    <div className="w-full bg-gradient-to-br from-green-900/80 to-ai-bg p-2 border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded-md backdrop-blur-sm">
                        <h3 className="font-bold mb-1 text-[9px] text-green-300 uppercase tracking-widest border-b border-green-500 pb-0.5">🎓 HINT:</h3>
                        <div className="text-[10px] text-green-200 font-mono p-1">
                            LEGAL MOVES: {game.moves().length}
                            <div className="mt-1">
                                <button
                                    onClick={() => alert(`Try moving: ${game.moves()[Math.floor(Math.random() * game.moves().length)]}`)}
                                    className="px-2 py-1 bg-green-700 text-white rounded text-[9px] font-bold hover:bg-green-600 transition-all"
                                >
                                    💡 GET HINT
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente auxiliar para extraer la pieza de la casilla de manera reactiva
const SquareWrapper = ({ game, square, isBlack, onDrop, fen }: any) => {
    const piece = game.getPiece(square);

    return (
        <Square
            position={square}
            piece={piece}
            isBlack={isBlack}
            onDrop={onDrop}
        />
    );
}
