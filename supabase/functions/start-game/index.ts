import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin, getErrorMessage } from '../_shared/supabase-admin.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        const supabase = createSupabaseAdmin();
        const { data, error } = await supabase
            .from('game_sessions')
            .insert({ user_agent: req.headers.get('user-agent') || '' })
            .select('id')
            .single();

        if (error) {
            console.error(error);
            return jsonResponse({ error: error.message || 'Failed to start game session' }, 500);
        }

        return jsonResponse({ sessionId: data.id });
    } catch (error) {
        console.error(error);
        return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
});
