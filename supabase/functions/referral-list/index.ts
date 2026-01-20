
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
    try {
        const { user, supabaseAdmin } = await requireAuth(req);

        // 1. Get referrals (users who registered via this partner)
        const { data: trackings, error: trackError } = await supabaseAdmin
            .from("referral_tracking")
            .select("auth_user_id, status, registered_at")
            .eq("partner_auth_id", user.id)
            .not("auth_user_id", "is", null)
            .order("registered_at", { ascending: false });

        if (trackError) throw trackError;

        if (!trackings || trackings.length === 0) {
            return new Response(JSON.stringify({ referrals: [] }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Fetch Emails and Stats
        const referrals = await Promise.all(trackings.map(async (t) => {
            // Get Email
            const { data: { user: referredUser } } = await supabaseAdmin.auth.admin.getUserById(t.auth_user_id);
            const email = referredUser?.email || "Unknown";

            // Get Total Purchases
            const { data: enrollments } = await supabaseAdmin
                .from("enrollments")
                .select("amount_paid")
                .eq("auth_user_id", t.auth_user_id)
                .eq("payment_status", "paid");

            const totalPurchases = enrollments?.reduce((sum, e) => sum + (e.amount_paid || 0), 0) || 0;

            return {
                user_id: t.auth_user_id,
                email: email,
                status: enrollments && enrollments.length > 0 ? "purchased" : (t.status === 'registered' ? 'registered' : 'visitor'),
                registered_at: t.registered_at,
                total_purchases: totalPurchases
            };
        }));

        return new Response(JSON.stringify({ referrals }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
});
