import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { SavedGame } from '@/lib/storage';

const GAMES_KEY = 'chess:games';

// GET /api/games/[id] - Fetch specific game
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const games = await kv.get<SavedGame[]>(GAMES_KEY) || [];
        const game = games.find(g => g.id === id);

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        return NextResponse.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
    }
}

// PATCH /api/games/[id] - Update game state
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const updates = await request.json();

        const games = await kv.get<SavedGame[]>(GAMES_KEY) || [];
        const gameIndex = games.findIndex(g => g.id === id);

        if (gameIndex === -1) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Update game with new data
        games[gameIndex] = {
            ...games[gameIndex],
            ...updates,
            lastUpdated: Date.now()
        };

        await kv.set(GAMES_KEY, games);

        return NextResponse.json(games[gameIndex]);
    } catch (error) {
        console.error('Error updating game:', error);
        return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }
}

// DELETE /api/games/[id] - Delete game
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const games = await kv.get<SavedGame[]>(GAMES_KEY) || [];
        const filteredGames = games.filter(g => g.id !== id);

        await kv.set(GAMES_KEY, filteredGames);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting game:', error);
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }
}
