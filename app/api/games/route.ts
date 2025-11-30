import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { SavedGame } from '@/lib/storage';

const GAMES_KEY = 'chess:games';

// GET /api/games - Fetch all games
export async function GET() {
    try {
        const games = await kv.get<SavedGame[]>(GAMES_KEY) || [];
        return NextResponse.json(games);
    } catch (error) {
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

        const games = await kv.get<SavedGame[]>(GAMES_KEY) || [];

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

        games.push(newGame);
        await kv.set(GAMES_KEY, games);

        return NextResponse.json(newGame, { status: 201 });
    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }
}
