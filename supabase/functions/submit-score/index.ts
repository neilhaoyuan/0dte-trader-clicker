import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin, getErrorMessage } from '../_shared/supabase-admin.ts';

const MAX_REASONABLE_SCORE = 1000000;
const MIN_RUN_SECONDS = 3;
const MAX_RUN_HOURS = 12;

function cleanPlayerName(name: unknown) {
    return String(name || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 20) || 'DGEN';
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const body = await req.json().catch(() => null);

    if (!body) {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const sessionId = String(body.sessionId || '');
    const playerName = cleanPlayerName(body.playerName);
    const score = Number(body.score);
    const peakCash = Number(body.peakCash || body.score);
    const level = Number(body.level);

    if (!sessionId || !Number.isFinite(score) || !Number.isFinite(peakCash) || !Number.isInteger(level)) {
        return jsonResponse({ error: 'Missing or invalid score data' }, 400);
    }

    if (score < 0 || peakCash < score || peakCash > MAX_REASONABLE_SCORE || score > MAX_REASONABLE_SCORE || level < 1 || level > 1000) {
        return jsonResponse({ error: 'Score rejected' }, 400);
    }

    try {
        const supabase = createSupabaseAdmin();
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .select('id, started_at, submitted_at')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            console.error(sessionError);
            return jsonResponse({ error: 'Game session not found' }, 404);
        }

        if (session.submitted_at) {
            return jsonResponse({ error: 'Score already submitted' }, 409);
        }

        const startedAt = new Date(session.started_at).getTime();
        const elapsedSeconds = (Date.now() - startedAt) / 1000;

        if (elapsedSeconds < MIN_RUN_SECONDS || elapsedSeconds > MAX_RUN_HOURS * 60 * 60) {
            return jsonResponse({ error: 'Game session timing rejected' }, 400);
        }

        const { error: insertError } = await supabase
            .from('leaderboard_scores')
            .insert({
                session_id: sessionId,
                player_name: playerName,
                score: Number(score.toFixed(2)),
                peak_cash: Number(peakCash.toFixed(2)),
                level
            });

        if (insertError) {
            console.error(insertError);
            return jsonResponse({ error: insertError.message || 'Failed to submit score' }, 500);
        }

        await supabase
            .from('game_sessions')
            .update({ submitted_at: new Date().toISOString() })
            .eq('id', sessionId);

        return jsonResponse({ ok: true });
    } catch (error) {
        console.error(error);
        return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
});
