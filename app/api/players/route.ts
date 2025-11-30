import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { Player } from '@/lib/storage';

const PLAYERS_KEY = 'chess:players';

// GET /api/players - Fetch all players
export async function GET() {
    try {
        const players = await kv.get<Player[]>(PLAYERS_KEY) || [];
        return NextResponse.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

// POST /api/players - Register new player
export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid player name' }, { status: 400 });
        }

        const players = await kv.get<Player[]>(PLAYERS_KEY) || [];

        // Check if player already exists
        if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            return NextResponse.json({ error: 'Player already exists' }, { status: 409 });
        }

        const newPlayer: Player = {
            id: crypto.randomUUID(),
            name,
            elo: 10,
            wins: 0,
            losses: 0,
            draws: 0
        };

        players.push(newPlayer);
        await kv.set(PLAYERS_KEY, players);

        return NextResponse.json(newPlayer, { status: 201 });
    } catch (error) {
        console.error('Error creating player:', error);
        return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
    }
}

// DELETE /api/players - Clear all players (with PIN protection)
export async function DELETE(request: Request) {
    try {
        const { pin } = await request.json();

        if (pin !== '0000') {
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
        }

        await kv.set(PLAYERS_KEY, []);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing players:', error);
        return NextResponse.json({ error: 'Failed to clear players' }, { status: 500 });
    }
}
