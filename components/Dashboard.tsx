'use client';

import React, { useState, useEffect } from 'react';
import { getGames, createNewGame, SavedGame, Player, getPlayers, registerPlayer, archiveGame, clearPlayers } from '@/lib/storage';

interface DashboardProps {
    onSelectGame: (game: SavedGame) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectGame }) => {
    const [games, setGames] = useState<SavedGame[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [newGameName, setNewGameName] = useState('');
    const [whitePlayer, setWhitePlayer] = useState('');
    const [blackPlayer, setBlackPlayer] = useState('');
    const [newPlayerName, setNewPlayerName] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [gameMode, setGameMode] = useState<'normal' | 'learning' | 'simulation'>('normal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>({ status: 'INIT', error: null, gamesCount: 0, playersCount: 0 });
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        loadData();

        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            loadData();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        // Don't set loading to true for background polling to avoid flickering
        // Only set it if it's the initial load or manual refresh
        if (!lastUpdated) setLoading(true);

        try {
            const start = Date.now();
            const [gamesRes, playersRes] = await Promise.all([
                fetch('/api/games', { cache: 'no-store' }),
                fetch('/api/players', { cache: 'no-store' })
            ]);

            const latency = Date.now() - start;

            if (!gamesRes.ok || !playersRes.ok) {
                throw new Error(`API Error: Games ${gamesRes.status} / Players ${playersRes.status}`);
            }

            const gamesData = await gamesRes.json();
            const playersData = await playersRes.json();

            setGames(gamesData);
            setPlayers(playersData);
            setLastUpdated(new Date());
            setDebugInfo({
                status: 'OK',
                latency,
                gamesCount: Array.isArray(gamesData) ? gamesData.length : 'ERR',
                playersCount: Array.isArray(playersData) ? playersData.length : 'ERR',
                lastCheck: new Date().toLocaleTimeString()
            });
        } catch (error: any) {
            console.error("Failed to load data:", error);
            setDebugInfo({
                status: 'ERROR',
                error: error.message || 'Unknown Error',
                lastCheck: new Date().toLocaleTimeString()
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGameName.trim() || !whitePlayer || !blackPlayer) return;
        if (whitePlayer === blackPlayer) {
            alert('Los agentes deben ser diferentes.');
            return;
        }
        setSaving(true);
        const game = await createNewGame(newGameName, whitePlayer, blackPlayer, gameMode);
        if (game) {
            await loadData();
            setNewGameName('');
            setWhitePlayer('');
            setBlackPlayer('');
            setGameMode('normal');
            onSelectGame(game);
        }
        setSaving(false);
    };

    const handleRegisterPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim()) return;
        setSaving(true);
        const player = await registerPlayer(newPlayerName.trim());
        if (player) {
            await loadData();
            setNewPlayerName('');
            alert('✅ AGENTE REGISTRADO EXITOSAMENTE');
        } else {
            // registerPlayer returns null if 409 Conflict (already exists) or error
            // We should ideally distinguish, but for now assuming null means duplicate or error
            alert('⛔ ERROR: El agente ya existe o hubo un problema de conexión.');
        }
        setSaving(false);
    };

    const handleArchive = async (gameId: string) => {
        await archiveGame(gameId);
        await loadData();
    };

    const handleClearPlayers = async () => {
        const code = prompt("🔒 ENTER SECURITY CODE TO CLEAR DATABASE:");
        if (code === "0000") {
            if (confirm("⚠ WARNING: THIS WILL PERMANENTLY DELETE ALL AGENTS. PROCEED?")) {
                setSaving(true);
                const success = await clearPlayers(code);
                if (success) {
                    await loadData();
                } else {
                    alert("⛔ FAILED TO CLEAR DATABASE");
                }
                setSaving(false);
            }
        } else if (code !== null) {
            alert("⛔ ACCESS DENIED: INVALID SECURITY CODE");
        }
    };

    return (
        <div className="w-full max-w-4xl p-6 flex flex-col md:flex-row gap-8 relative z-10">

            {/* Left Column: Game Control */}
            <div className="flex-1 bg-gradient-to-br from-ai-panel to-ai-bg border-2 border-ai-accent shadow-[0_0_30px_rgba(0,255,255,0.3)] p-6 h-fit rounded-lg backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-6 text-ai-highlight uppercase tracking-widest border-b-2 border-ai-accent pb-3 text-center animate-[glow-pulse_3s_ease-in-out_infinite]">
                    ♔ CHESS BOARD ♚
                </h2>

                <form onSubmit={handleCreate} className="flex flex-col gap-4 mb-8 bg-black bg-opacity-50 p-4 border-2 border-ai-accent border-opacity-30 rounded-lg">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase text-ai-accent tracking-wider font-bold">📡 OPERATION NAME</label>
                        <input
                            type="text"
                            value={newGameName}
                            onChange={(e) => setNewGameName(e.target.value)}
                            placeholder="ENTER OPERATION CODE..."
                            className="bg-black bg-opacity-70 border-2 border-ai-accent border-opacity-50 rounded-lg px-4 py-3 text-ai-highlight font-mono focus:outline-none focus:border-ai-accent focus:shadow-[0_0_15px_rgba(0,255,255,0.4)] placeholder-ai-text placeholder-opacity-40 uppercase transition-all"
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs uppercase text-ai-accent tracking-wider font-bold">⚪ WHITE AGENT</label>
                            <select
                                value={whitePlayer}
                                onChange={(e) => setWhitePlayer(e.target.value)}
                                className="w-full bg-black bg-opacity-70 border-2 border-ai-accent border-opacity-50 rounded-lg px-4 py-3 text-ai-highlight font-mono focus:outline-none focus:border-ai-accent focus:shadow-[0_0_15px_rgba(0,255,255,0.4)] uppercase transition-all"
                                required
                            >
                                <option value="">SELECCIONAR</option>
                                {players.map(p => <option key={p.id} value={p.name}>{p.name} ({p.elo})</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs uppercase text-ai-accent tracking-wider font-bold">⚫ BLACK AGENT</label>
                            <select
                                value={blackPlayer}
                                onChange={(e) => setBlackPlayer(e.target.value)}
                                className="w-full bg-black bg-opacity-70 border-2 border-ai-accent border-opacity-50 rounded-lg px-4 py-3 text-ai-highlight font-mono focus:outline-none focus:border-ai-accent focus:shadow-[0_0_15px_rgba(0,255,255,0.4)] uppercase transition-all"
                                required
                            >
                                <option value="">SELECCIONAR</option>
                                {players.map(p => <option key={p.id} value={p.name}>{p.name} ({p.elo})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase text-ai-accent tracking-wider font-bold">🎮 MISSION MODE</label>
                        <select
                            value={gameMode}
                            onChange={(e) => setGameMode(e.target.value as any)}
                            className="w-full bg-black bg-opacity-70 border-2 border-ai-accent border-opacity-50 rounded-lg px-4 py-3 text-ai-highlight font-mono focus:outline-none focus:border-ai-accent focus:shadow-[0_0_15px_rgba(0,255,255,0.4)] uppercase transition-all"
                        >
                            <option value="normal">⚔️ RANKED MISSION (NORMAL)</option>
                            <option value="learning">🎓 TRAINING (NO ELO + HINTS)</option>
                            <option value="simulation">🔮 SIMULATION (AI ANALYSIS)</option>
                        </select>
                    </div>

                    <button type="submit" disabled={saving || loading} className="bg-gradient-to-r from-ai-accent to-ai-highlight text-ai-bg font-bold py-3 px-6 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] active:scale-95 transition-all uppercase tracking-widest border-2 border-ai-accent disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? '⏳ PROCESANDO...' : '🚀 INICIAR MISION'}
                    </button>
                </form>

                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-ai-accent uppercase tracking-wider flex items-center gap-2">
                            <span className="animate-pulse">🎯</span> {showArchived ? 'ARCHIVED' : 'ACTIVE'} MISSIONS:
                        </h3>
                        <div className="flex gap-2 items-center">
                            {lastUpdated && (
                                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                                    UPDATED: {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                            <button
                                onClick={() => loadData()}
                                className="text-xs px-2 py-1 bg-blue-900/30 border border-blue-500 text-blue-400 hover:bg-blue-800 hover:text-white transition-all rounded uppercase font-bold"
                                title="Force Refresh"
                            >
                                ↻
                            </button>
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="text-xs px-3 py-1 bg-ai-panel border border-ai-accent text-ai-accent hover:bg-ai-accent hover:text-ai-bg transition-all rounded uppercase font-bold"
                            >
                                {showArchived ? '📂 SHOW ACTIVE' : '📁 SHOW ARCHIVED'}
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <p className="text-ai-accent text-center italic font-mono border border-dashed border-ai-accent p-4 rounded animate-pulse">
                            ⏳ LOADING MISSIONS...
                        </p>
                    ) : games.filter(g => showArchived ? g.archived : !g.archived).length === 0 ? (
                        <p className="text-slate-400 text-center italic font-mono border border-dashed border-slate-600 p-4 rounded">
                            {showArchived ? 'NO ARCHIVED GAMES.' : 'NO HAY DATOS DE INTELIGENCIA.'}
                        </p>
                    ) : (
                        games.filter(g => showArchived ? g.archived : !g.archived).sort((a, b) => b.lastUpdated - a.lastUpdated).map((game) => (
                            <div
                                key={game.id}
                                className="group p-3 bg-gradient-to-r from-ai-bg to-ai-panel border-2 border-slate-600 hover:border-ai-highlight transition-all rounded-lg relative"
                            >
                                <div
                                    onClick={() => onSelectGame(game)}
                                    className="cursor-pointer flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-ai-highlight uppercase tracking-wider group-hover:text-white">{game.name}</h3>
                                            {game.winner && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-ai-accent text-ai-bg font-bold uppercase">
                                                    {game.winner === 'draw' ? '🤝 DRAW' : `🏆 ${game.winner === 'w' ? 'WHITE' : 'BLACK'} WINS`}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono mt-1">
                                            <span className="text-ai-text">{game.whitePlayer}</span> VS <span className="text-ai-text">{game.blackPlayer}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-500 uppercase mt-1">
                                            ULTIMO CONTACTO: {new Date(game.lastUpdated).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-ai-highlight font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                                </div>
                                {game.winner && !game.archived && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchive(game.id);
                                        }}
                                        className="absolute top-2 right-2 text-[10px] px-2 py-1 bg-ai-highlight bg-opacity-20 border border-ai-highlight text-ai-highlight hover:bg-ai-highlight hover:text-ai-bg transition-all rounded uppercase font-bold"
                                    >
                                        📁 ARCHIVE
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Column: Player Ranking & Registration */}
            <div className="w-full md:w-80 flex flex-col gap-6">

                {/* Registration */}
                <div className="bg-gradient-to-br from-ai-panel to-ai-bg border-2 border-ai-highlight shadow-[0_0_25px_rgba(255,0,255,0.3)] p-5 rounded-lg backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 text-ai-highlight uppercase tracking-widest border-b-2 border-ai-highlight pb-2 flex items-center gap-2">
                        <span>🔮</span> RECRUITMENT
                    </h3>
                    <form onSubmit={handleRegisterPlayer} className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="AGENT CODENAME..."
                            className="bg-black bg-opacity-70 border-2 border-ai-highlight border-opacity-50 rounded-lg px-4 py-3 text-ai-highlight font-mono focus:outline-none focus:border-ai-highlight focus:shadow-[0_0_15px_rgba(255,0,255,0.4)] placeholder-ai-text placeholder-opacity-40 uppercase w-full transition-all"
                            required
                        />
                        <button type="submit" disabled={saving || loading} className="bg-gradient-to-r from-ai-highlight to-purple-600 text-white px-4 py-3 font-bold uppercase tracking-widest border-2 border-ai-highlight hover:shadow-[0_0_25px_rgba(255,0,255,0.6)] active:scale-95 transition-all text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? '⏳ SAVING...' : 'REGISTRAR AGENTE'}
                        </button>
                    </form>
                </div>

                {/* Ranking */}
                <div className="bg-gradient-to-br from-ai-panel to-ai-bg border-2 border-ai-accent shadow-[0_0_25px_rgba(0,255,255,0.3)] p-5 flex-1 rounded-lg backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 text-ai-accent uppercase tracking-widest border-b-2 border-ai-accent pb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span>🏆</span> ELO RANKING
                        </div>
                        {players.length > 0 && (
                            <button
                                onClick={handleClearPlayers}
                                disabled={saving || loading}
                                className="text-[10px] px-2 py-1 bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-900 hover:text-white transition-all rounded uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🗑️ CLEAR
                            </button>
                        )}
                    </h3>
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <p className="text-ai-accent text-center italic font-mono text-sm animate-pulse">⏳ LOADING...</p>
                        ) : players.length === 0 ? (
                            <p className="text-slate-400 text-center italic font-mono text-sm">SIN AGENTES REGISTRADOS</p>
                        ) : (
                            players.sort((a, b) => b.elo - a.elo).map((player, index) => (
                                <div key={player.id} className="flex justify-between items-center bg-black/20 p-2 border border-slate-600">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                                            #{index + 1}
                                        </span>
                                        <span className="text-ai-text font-bold uppercase tracking-wider text-sm">{player.name}</span>
                                    </div>
                                    <span className="text-ai-highlight font-mono font-bold">{player.elo}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>


            </div>

            {/* Version Indicator & Debug Toggle */}
            <div className="fixed bottom-1 right-1 flex flex-col items-end gap-1 pointer-events-auto">
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-[9px] text-slate-600 font-mono opacity-50 hover:opacity-100 transition-opacity"
                >
                    v2.1 - ATOMIC STORAGE (DEBUG)
                </button>

                {showDebug && (
                    <div className="bg-black/90 border border-red-500 p-2 rounded text-[10px] font-mono text-green-400 w-64 shadow-lg">
                        <h4 className="border-b border-red-500 mb-1 text-red-500 font-bold">SYSTEM DIAGNOSTICS</h4>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <span>STATUS:</span> <span className={debugInfo.status === 'OK' ? 'text-green-400' : 'text-red-500 font-bold'}>{debugInfo.status}</span>
                            <span>LATENCY:</span> <span>{debugInfo.latency || 0}ms</span>
                            <span>GAMES:</span> <span>{debugInfo.gamesCount}</span>
                            <span>PLAYERS:</span> <span>{debugInfo.playersCount}</span>
                            <span>LAST CHECK:</span> <span>{debugInfo.lastCheck}</span>
                        </div>
                        {debugInfo.error && (
                            <div className="mt-1 text-red-500 border-t border-red-500/50 pt-1 break-words">
                                ERR: {debugInfo.error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
