
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
    try {
        const { user, supabaseAdmin } = await requireAuth(req);

        // 1. Get Referral Tracking Stats
        const { data: trackings, error: trackError } = await supabaseAdmin
            .from("referral_tracking")
            .select("visitor_ip, status, auth_user_id")
            .eq("partner_auth_id", user.id);

        if (trackError) throw trackError;

        const totalVisits = trackings?.length || 0;
        const uniqueVisits = new Set(trackings?.map(t => t.visitor_ip)).size;
        const registrations = trackings?.filter(t => t.auth_user_id).length || 0;

        // 2. Get Rewards Stats
        const { data: rewards, error: maxError } = await supabaseAdmin
            .from("referral_rewards")
            .select("amount, reward_type, status")
            .eq("partner_auth_id", user.id);

        if (maxError) throw maxError;

        const totalRewards = rewards?.reduce((sum, r) => sum + r.amount, 0) || 0;
        const visitRewards = rewards?.filter(r => r.reward_type === 'visit').reduce((sum, r) => sum + r.amount, 0) || 0;
        const regRewards = rewards?.filter(r => r.reward_type === 'registration').reduce((sum, r) => sum + r.amount, 0) || 0;
        const purchaseRewards = rewards?.filter(r => r.reward_type === 'purchase').reduce((sum, r) => sum + r.amount, 0) || 0;

        // 3. Get Withdrawals Stats
        const { data: withdrawals, error: withError } = await supabaseAdmin
            .from("referral_withdrawals")
            .select("amount, status")
            .eq("partner_auth_id", user.id);

        if (withError) throw withError;

        const withdrawn = withdrawals?.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0) || 0;
        const pending = withdrawals?.filter(w => ['pending', 'approved'].includes(w.status)).reduce((sum, w) => sum + w.amount, 0) || 0;

        const currentBalance = totalRewards - withdrawn - pending;

        // 4. Calculate Purchases (Count from rewards of type purchase, usually 1 reward per purchase)
        // Alternatively, query enrollments for more accuracy if rewards are batched? usually 1-to-1.
        const purchaseCount = rewards?.filter(r => r.reward_type === 'purchase').length || 0;

        const stats = {
            visits: {
                total: totalVisits,
                unique: uniqueVisits,
            },
            registrations: {
                total: registrations,
                conversion: totalVisits > 0 ? (registrations / totalVisits) * 100 : 0,
            },
            purchases: {
                total: purchaseCount,
                // Approximate total amount of purchases driven (not commission) -> we'd need to join enrollments for this.
                // For dashboard quick stats, maybe strict commission is enough?
                // Let's leave amount/avg as 0 or derive from fixed commission rates if possible. 
                // For now, let's keep it simple.
                total_amount: 0,
                avg_amount: 0,
                conversion: registrations > 0 ? (purchaseCount / registrations) * 100 : 0,
            },
            rewards: {
                visit: visitRewards,
                registration: regRewards,
                purchase: purchaseRewards,
                total: totalRewards,
            },
            balance: {
                total_earnings: totalRewards,
                current_balance: currentBalance,
                withdrawn: withdrawn,
                pending: pending,
            },
        };

        return new Response(JSON.stringify({ stats }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
});
