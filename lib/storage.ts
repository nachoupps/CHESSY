export interface SavedGame {
    id: string;
    name: string;
    whitePlayer: string; // Player Name
    blackPlayer: string; // Player Name
    fen: string;
    lastUpdated: number;
    winner?: 'w' | 'b' | 'draw'; // To track if game is finished
    archived?: boolean; // To track if game is archived
    undoUsed?: boolean; // Track if emergency undo has been used
    mode?: 'normal' | 'learning' | 'simulation'; // Game mode
}

export interface Player {
    id: string;
    name: string;
    elo: number;
    wins: number;
    losses: number;
    draws: number;
}

const STORAGE_KEY_GAMES = 'chess_app_games';
const STORAGE_KEY_PLAYERS = 'chess_app_players';

// --- Games ---

export const getGames = (): SavedGame[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY_GAMES);
    return stored ? JSON.parse(stored) : [];
};

export const saveGame = (game: SavedGame) => {
    const games = getGames();
    const index = games.findIndex((g) => g.id === game.id);
    if (index >= 0) {
        games[index] = game;
    } else {
        games.push(game);
    }
    localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
};

export const archiveGame = (gameId: string) => {
    const games = getGames();
    const index = games.findIndex((g) => g.id === gameId);
    if (index >= 0) {
        games[index].archived = true;
        localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
    }
};

export const deleteGame = (gameId: string) => {
    const games = getGames();
    const filtered = games.filter((g) => g.id !== gameId);
    localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(filtered));
};

export const createNewGame = (name: string, whitePlayer: string, blackPlayer: string, mode: 'normal' | 'learning' | 'simulation' = 'normal'): SavedGame => {
    const newGame: SavedGame = {
        id: crypto.randomUUID(),
        name,
        whitePlayer,
        blackPlayer,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Start FEN
        lastUpdated: Date.now(),
        mode
    };
    saveGame(newGame);
    return newGame;
};

// --- Players ---

export const getPlayers = (): Player[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY_PLAYERS);
    return stored ? JSON.parse(stored) : [];
};

export const registerPlayer = (name: string): Player | null => {
    const players = getPlayers();
    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        return null; // Player already exists
    }
    const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        elo: 10, // Start with 10 ELO
        wins: 0,
        losses: 0,
        draws: 0
    };
    players.push(newPlayer);
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    return newPlayer;
};

export const updatePlayerStats = (playerName: string, result: 'win' | 'loss' | 'draw', eloChange: number) => {
    const players = getPlayers();
    const index = players.findIndex(p => p.name === playerName);
    if (index >= 0) {
        players[index].elo += eloChange;
        if (result === 'win') players[index].wins++;
        if (result === 'loss') players[index].losses++;
        if (result === 'draw') players[index].draws++;
        localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    }
};
