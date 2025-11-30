import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { Player } from '@/lib/storage';

const PLAYERS_KEY = 'chess:players';

// PATCH /api/players/[id] - Update player stats
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { result, eloChange } = await request.json();

        if (!result || !['win', 'loss', 'draw'].includes(result)) {
            return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
        }

        if (typeof eloChange !== 'number') {
            return NextResponse.json({ error: 'Invalid ELO change' }, { status: 400 });
        }

        const players = await kv.get<Player[]>(PLAYERS_KEY) || [];
        const playerIndex = players.findIndex(p => p.id === id);

        if (playerIndex === -1) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        // Update player stats
        players[playerIndex].elo += eloChange;
        if (result === 'win') players[playerIndex].wins++;
        if (result === 'loss') players[playerIndex].losses++;
        if (result === 'draw') players[playerIndex].draws++;

        await kv.set(PLAYERS_KEY, players);

        return NextResponse.json(players[playerIndex]);
    } catch (error) {
        console.error('Error updating player:', error);
        return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }
}
