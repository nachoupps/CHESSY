import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { Player } from '@/lib/storage';

const PLAYERS_KEY = 'chess:players';
export const dynamic = 'force-dynamic';

// GET /api/players - Fetch all players
export async function GET() {
    try {
        const playersDict = await kv.hgetall<Record<string, Player>>(PLAYERS_KEY) || {};
        const players = Object.values(playersDict);
        return NextResponse.json(players);
    } catch (error: any) {
        // Handle migration from String (old format) to Hash (new format)
        if (error.message && error.message.includes('WRONGTYPE')) {
            console.log('Migrating players from String to Hash...');
            try {
                const oldPlayers = await kv.get<Player[]>(PLAYERS_KEY);
                if (Array.isArray(oldPlayers) && oldPlayers.length > 0) {
                    await kv.del(PLAYERS_KEY);
                    const pipeline = kv.pipeline();
                    const newHash: Record<string, Player> = {};
                    for (const p of oldPlayers) {
                        newHash[p.id] = p;
                    }
                    await kv.hset(PLAYERS_KEY, newHash);
                    return NextResponse.json(oldPlayers);
                } else {
                    // If empty or invalid, just delete and return empty
                    await kv.del(PLAYERS_KEY);
                    return NextResponse.json([]);
                }
            } catch (migrationError) {
                console.error('Migration failed:', migrationError);
                return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 });
            }
        }
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

        // Check if player already exists
        // With Hashes, we still need to check all values for name uniqueness
        const playersDict = await kv.hgetall<Record<string, Player>>(PLAYERS_KEY) || {};
        const players = Object.values(playersDict);

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

        // Use hset for atomic addition (field is ID)
        await kv.hset(PLAYERS_KEY, { [newPlayer.id]: newPlayer });

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

        await kv.del(PLAYERS_KEY);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing players:', error);
        return NextResponse.json({ error: 'Failed to clear players' }, { status: 500 });
    }
}
