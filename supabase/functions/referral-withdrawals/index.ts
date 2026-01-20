
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
    try {
        const { user, supabaseAdmin } = await requireAuth(req);

        const { data: withdrawals, error } = await supabaseAdmin
            .from("referral_withdrawals")
            .select("*")
            .eq("partner_auth_id", user.id)
            .order("requested_at", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ withdrawals: withdrawals || [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
});
