
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
    try {
        const { user, supabaseAdmin } = await requireAuth(req);

        const { limit = 20, offset = 0, reward_type = 'all', status = 'all' } = await req.json();

        let query = supabaseAdmin
            .from("referral_rewards")
            .select("*", { count: "exact" })
            .eq("auth_user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (reward_type !== 'all') {
            query = query.eq("reward_type", reward_type);
        }

        if (status !== 'all') {
            query = query.eq("status", status);
        }

        const { data: rewards, error, count } = await query;

        if (error) {
            console.error("Error fetching rewards:", error);
            throw error;
        }

        return new Response(JSON.stringify({ rewards, total: count }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
});
