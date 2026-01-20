import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            apiVersion: "2023-10-16",
        });


        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            // If called from client without auth header, throw error.
            // But since this function doesn't actually rely on who the caller is (it relies on session_id), 
            // we could technically be looser. 
            // However, to satisfy client-side libraries that send it, we should accept it.
            // For now, let's just log it and proceed if we want to be permissive, 
            // OR enforce it if we want security. 
            // Better to enforce that at least SOME token is present.
            throw new Error("Missing Authorization header");
        }

        // We initialize admin client - no need to verify user aggressively 
        // because we are verifying the STRIPE SESSION ID which acts as a proof of purchase.
        // Whoever has the session ID can check its status. 
        // This is safe because session IDs are long random strings.

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );


        const { session_id } = await req.json();

        if (!session_id) {
            throw new Error("Missing session_id");
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        let courseData = null;
        let amount = null;
        let enrollmentActivated = false;

        if (session.payment_status === "paid" && session.metadata) {
            const { userId, courseId, tariffId } = session.metadata;

            // Check if enrollment already exists and is paid
            const { data: enrollment } = await supabaseAdmin
                .from("enrollments")
                .select("*")
                .eq("auth_user_id", userId)
                .eq("course_id", courseId)
                .maybeSingle();

            if (enrollment && enrollment.payment_status === "paid") {
                enrollmentActivated = true;
                amount = parseFloat(enrollment.amount_paid);
            } else {
                // This is a fallback if webhook hasn't fired yet
                // We'll trust the Stripe session status here
                console.log(`Manual activation fallback for user ${userId}, course ${courseId}`);

                const price = session.amount_total ? session.amount_total / 100 : 0;

                const { error: upsertError } = await supabaseAdmin
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
                    }, { onConflict: 'auth_user_id, course_id' });

                if (!upsertError) {
                    enrollmentActivated = true;
                    amount = price;
                }
            }

            // Get course info for tracking
            const { data: course } = await supabaseAdmin
                .from("courses")
                .select("id, title, slug")
                .eq("id", courseId)
                .single();

            if (course) {
                courseData = course;
            }
        }

        return new Response(JSON.stringify({
            status: session.payment_status,
            sessionId: session.id,
            customerEmail: session.customer_email,
            enrollmentActivated: enrollmentActivated,
            course: courseData,
            amount: amount,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
