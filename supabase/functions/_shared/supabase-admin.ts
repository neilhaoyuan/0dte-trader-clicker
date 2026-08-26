import { createClient } from 'npm:@supabase/supabase-js@2';

export function createSupabaseAdmin() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKey = Deno.env.get('APP_SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !secretKey) {
        throw new Error('Missing SUPABASE_URL or APP_SUPABASE_SERVICE_KEY.');
    }

    return createClient(supabaseUrl, secretKey);
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Unknown server error';
}
