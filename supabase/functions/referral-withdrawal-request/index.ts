
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
    try {
        const { user, supabaseAdmin } = await requireAuth(req);

        const { amount, payment_details, telegram_tag } = await req.json();

        if (!amount || amount <= 0) {
            throw new Error("Invalid amount");
        }
        if (!payment_details) {
            throw new Error("Missing payment details");
        }

        // Check Balance
        // Calculate total rewards
        const { data: rewards, error: rError } = await supabaseAdmin
            .from("referral_rewards")
            .select("amount")
            .eq("partner_auth_id", user.id);

        if (rError) throw rError;
        const totalRewards = rewards?.reduce((sum, r) => sum + r.amount, 0) || 0;

        // Calculate withdrawals
        const { data: withdrawals, error: wError } = await supabaseAdmin
            .from("referral_withdrawals")
            .select("amount, status")
            .eq("partner_auth_id", user.id);

        if (wError) throw wError;

        // Deduct paid and pending/approved withdrawals from balance
        const usedFunds = withdrawals?.filter(w => ['paid', 'pending', 'approved'].includes(w.status))
            .reduce((sum, w) => sum + w.amount, 0) || 0;

        const availableBalance = totalRewards - usedFunds;

        if (amount > availableBalance) {
            throw new Error("Insufficient funds");
        }

        // Create Request
        const { data, error } = await supabaseAdmin
            .from("referral_withdrawals")
            .insert({
                partner_auth_id: user.id,
                amount,
                payment_details,
                telegram_tag,
                status: "pending",
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, withdrawal: data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
});
