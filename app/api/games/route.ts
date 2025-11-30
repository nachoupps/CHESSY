import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { SavedGame } from '@/lib/storage';

const GAMES_KEY = 'chess:games';
export const dynamic = 'force-dynamic';

// GET /api/games - Fetch all games
export async function GET() {
    try {
        const gamesDict = await kv.hgetall<Record<string, SavedGame>>(GAMES_KEY) || {};
        const games = Object.values(gamesDict);
        return NextResponse.json(games);
    } catch (error: any) {
        // Handle migration from String (old format) to Hash (new format)
        if (error.message && error.message.includes('WRONGTYPE')) {
            console.log('Migrating games from String to Hash...');
            try {
                const oldGames = await kv.get<SavedGame[]>(GAMES_KEY);
                if (Array.isArray(oldGames) && oldGames.length > 0) {
                    await kv.del(GAMES_KEY);
                    const newHash: Record<string, SavedGame> = {};
                    for (const g of oldGames) {
                        newHash[g.id] = g;
                    }
                    await kv.hset(GAMES_KEY, newHash);
                    return NextResponse.json(oldGames);
                } else {
                    await kv.del(GAMES_KEY);
                    return NextResponse.json([]);
                }
            } catch (migrationError) {
                console.error('Migration failed:', migrationError);
                return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 });
            }
        }
        console.error('Error fetching games:', error);
        return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }
}

// POST /api/games - Create new game
export async function POST(request: Request) {
    try {
        const { name, whitePlayer, blackPlayer, mode } = await request.json();

        if (!name || !whitePlayer || !blackPlayer) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newGame: SavedGame = {
            id: crypto.randomUUID(),
            name,
            whitePlayer,
            blackPlayer,
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lastUpdated: Date.now(),
            mode: mode || 'normal',
            undoUsed: false
        };

        // Use hset for atomic addition
        await kv.hset(GAMES_KEY, { [newGame.id]: newGame });

        return NextResponse.json(newGame, { status: 201 });
    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }
}
