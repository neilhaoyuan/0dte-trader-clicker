import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin, getErrorMessage } from '../_shared/supabase-admin.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        const supabase = createSupabaseAdmin();
        const { data, error } = await supabase
            .from('leaderboard_scores')
            .select('player_name, score, level')
            .order('score', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(10);

        if (error) {
            console.error(error);
            return jsonResponse({ error: error.message || 'Failed to load leaderboard' }, 500);
        }

        return jsonResponse({ scores: data || [] });
    } catch (error) {
        console.error(error);
        return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
});
