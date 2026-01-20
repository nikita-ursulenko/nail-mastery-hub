
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
    try {
        const { user, supabaseAdmin } = await requireAuth(req);

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            apiVersion: "2023-10-16",
        });

        const { session_id } = await req.json();

        if (!session_id) {
            throw new Error("Missing session_id");
        }

        // 1. Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== "paid") {
            throw new Error("Payment not completed");
        }

        // 2. Verify metadata
        const { userId, courseId, tariffId } = session.metadata || {};

        if (!userId || !courseId || !tariffId) {
            throw new Error("Invalid session metadata");
        }

        if (userId !== user.id) {
            throw new Error("Session does not belong to this user");
        }

        // 3. Create or update enrollment
        const { data, error } = await supabaseAdmin
            .from("enrollments")
            .upsert(
                {
                    auth_user_id: user.id,
                    course_id: parseInt(courseId),
                    tariff_id: parseInt(tariffId),
                    payment_status: "paid",
                    status: "active",
                    purchased_at: new Date().toISOString(),
                    // progress defaults to 0
                },
                { onConflict: "auth_user_id, course_id" }
            )
            .select()
            .single();

        if (error) {
            console.error("Enrollment error:", error);
            throw error;
        }

        return new Response(JSON.stringify({ success: true, enrollment: data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return handleError(error);
    }
});
