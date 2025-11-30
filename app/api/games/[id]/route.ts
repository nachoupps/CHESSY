import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { SavedGame } from '@/lib/storage';

const GAMES_KEY = 'chess:games';
export const dynamic = 'force-dynamic';

// GET /api/games/[id] - Fetch specific game
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const game = await kv.hget<SavedGame>(GAMES_KEY, id);

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

        const game = await kv.hget<SavedGame>(GAMES_KEY, id);

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Update game with new data
        const updatedGame = {
            ...game,
            ...updates,
            lastUpdated: Date.now()
        };

        await kv.hset(GAMES_KEY, { [id]: updatedGame });

        return NextResponse.json(updatedGame);
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
        await kv.hdel(GAMES_KEY, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting game:', error);
        return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }
}
