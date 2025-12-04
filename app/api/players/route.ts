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
        const { name, pin } = await request.json();

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid player name' }, { status: 400 });
        }

        if (!pin || typeof pin !== 'string' || pin.length !== 4) {
            return NextResponse.json({ error: 'Invalid PIN (must be 4 digits)' }, { status: 400 });
        }

        // Check if player already exists
        // With Hashes, we still need to check all values for name uniqueness
        let players: Player[] = [];
        try {
            const playersDict = await kv.hgetall<Record<string, Player>>(PLAYERS_KEY) || {};
            players = Object.values(playersDict) as Player[];
        } catch (error: any) {
            console.warn('POST: Error fetching players (possible WRONGTYPE), assuming empty or corrupt:', error);
            // If it's a WRONGTYPE, we might want to delete it to allow new write, 
            // but safer to just let the write happen if we can, or fail gracefully.
            // If we can't read, we can't check for duplicates easily. 
            // Let's try to delete if it's WRONGTYPE to self-heal.
            if (error.message && error.message.includes('WRONGTYPE')) {
                await kv.del(PLAYERS_KEY);
            }
        }

        if (players.find((p: Player) => p.name.toLowerCase() === name.toLowerCase())) {
            return NextResponse.json({ error: 'Player already exists' }, { status: 409 });
        }

        // Generate ID safely
        let id;
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            id = crypto.randomUUID();
        } else {
            // Fallback for environments where crypto.randomUUID is not available
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        const newPlayer: Player = {
            id,
            name,
            elo: 10,
            wins: 0,
            losses: 0,
            draws: 0,
            pin
        };

        // Use hset for atomic addition (field is ID)
        await kv.hset(PLAYERS_KEY, { [newPlayer.id]: newPlayer });

        return NextResponse.json(newPlayer, { status: 201 });
    } catch (error: any) {
        console.error('Error creating player:', error);
        return NextResponse.json({ error: 'Failed to create player', details: error.message }, { status: 500 });
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
