import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

Deno.serve(async (req) => {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
        apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
        return new Response("Missing signature or webhook secret", { status: 400 });
    }

    try {
        const body = await req.text();
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.payment_status === "paid" && session.metadata) {
                const { userId, courseId, tariffId } = session.metadata;

                console.log(`Processing payment for user ${userId}, course ${courseId}`);

                const price = session.amount_total ? session.amount_total / 100 : 0;

                // Using auth_user_id
                const { data: enrollment, error: enrollmentError } = await supabaseAdmin
                    .from("enrollments")
                    .upsert({
                        auth_user_id: userId,
                        course_id: parseInt(courseId),
                        tariff_id: parseInt(tariffId),
                        payment_id: session.payment_intent as string || session.id,
                        payment_status: "paid",
                        amount_paid: price,
                        status: "active",
                        purchased_at: new Date().toISOString(),
                        started_at: new Date().toISOString(),
                    }, { onConflict: 'auth_user_id, course_id' })
                    .select('id')
                    .single();

                if (enrollmentError) {
                    console.error("Error creating enrollment:", enrollmentError);
                    throw enrollmentError;
                }

                // Referral logic using partner_auth_id and auth_user_id
                try {
                    const { data: tracking } = await supabaseAdmin
                        .from("referral_tracking")
                        .select("id, partner_auth_id")
                        .eq("auth_user_id", userId)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (tracking && tracking.partner_auth_id) {
                        const rewardAmount = price * 0.1; // 10%

                        await supabaseAdmin.from("referral_rewards").insert({
                            partner_auth_id: tracking.partner_auth_id,
                            tracking_id: tracking.id,
                            auth_user_id: userId,
                            enrollment_id: enrollment.id,
                            reward_type: "purchase",
                            amount: rewardAmount,
                            status: "approved",
                            description: `Commission for course purchase`,
                        });

                        await supabaseAdmin.from("referral_tracking").update({
                            status: "purchased",
                        }).eq("id", tracking.id);
                    }
                } catch (referralError) {
                    console.error("Referral reward error:", referralError);
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Webhook error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
        });
    }
});
