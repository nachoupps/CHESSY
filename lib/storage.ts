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

// --- Players API ---

export const getPlayers = async (): Promise<Player[]> => {
    try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        return await response.json();
    } catch (error) {
        console.error('Error fetching players:', error);
        return [];
    }
};

export const registerPlayer = async (name: string): Promise<Player | null> => {
    try {
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.status === 409) {
            return null; // Player already exists
        }

        if (!response.ok) throw new Error('Failed to register player');
        return await response.json();
    } catch (error) {
        console.error('Error registering player:', error);
        return null;
    }
};

export const updatePlayerStats = async (
    playerId: string,
    result: 'win' | 'loss' | 'draw',
    eloChange: number
): Promise<void> => {
    try {
        const response = await fetch(`/api/players/${playerId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result, eloChange })
        });

        if (!response.ok) throw new Error('Failed to update player stats');
    } catch (error) {
        console.error('Error updating player stats:', error);
    }
};

export const clearPlayers = async (pin: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/players', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });

        return response.ok;
    } catch (error) {
        console.error('Error clearing players:', error);
        return false;
    }
};

// --- Games API ---

export const getGames = async (): Promise<SavedGame[]> => {
    try {
        const response = await fetch('/api/games');
        if (!response.ok) throw new Error('Failed to fetch games');
        return await response.json();
    } catch (error) {
        console.error('Error fetching games:', error);
        return [];
    }
};

export const getGame = async (gameId: string): Promise<SavedGame | null> => {
    try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching game:', error);
        return null;
    }
};

export const saveGame = async (game: SavedGame): Promise<void> => {
    try {
        const response = await fetch(`/api/games/${game.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        });

        if (!response.ok) throw new Error('Failed to save game');
    } catch (error) {
        console.error('Error saving game:', error);
    }
};

export const archiveGame = async (gameId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/games/${gameId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archived: true })
        });

        if (!response.ok) throw new Error('Failed to archive game');
    } catch (error) {
        console.error('Error archiving game:', error);
    }
};

export const deleteGame = async (gameId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/games/${gameId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete game');
    } catch (error) {
        console.error('Error deleting game:', error);
    }
};

export const createNewGame = async (
    name: string,
    whitePlayer: string,
    blackPlayer: string,
    mode: 'normal' | 'learning' | 'simulation' = 'normal'
): Promise<SavedGame | null> => {
    try {
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, whitePlayer, blackPlayer, mode })
        });

        if (!response.ok) throw new Error('Failed to create game');
        return await response.json();
    } catch (error) {
        console.error('Error creating game:', error);
        return null;
    }
};

