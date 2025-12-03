import { NextResponse } from 'next/server';
import kv from '@/lib/kv';
import { Player } from '@/lib/storage';

const PLAYERS_KEY = 'chess:players';
export const dynamic = 'force-dynamic';

// PATCH /api/players/[id] - Update player stats
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { result, eloChange } = await request.json();

        if (!result || !['win', 'loss', 'draw'].includes(result)) {
            return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
        }

        if (typeof eloChange !== 'number') {
            return NextResponse.json({ error: 'Invalid ELO change' }, { status: 400 });
        }

        // Fetch only the specific player
        const player = await kv.hget<Player>(PLAYERS_KEY, id);

        if (!player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        // Update player stats
        player.elo += eloChange;
        if (result === 'win') player.wins++;
        if (result === 'loss') player.losses++;
        if (result === 'draw') player.draws++;

        // Save back using hset (atomic update for this field)
        await kv.hset(PLAYERS_KEY, { [id]: player });

        return NextResponse.json(player);
    } catch (error) {
        console.error('Error updating player:', error);
        return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }
}
