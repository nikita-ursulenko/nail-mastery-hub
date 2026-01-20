import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


import { jwtVerify } from "https://esm.sh/jose@5.2.3";

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            apiVersion: "2023-10-16",
        });

        // 1. Get Authorization Header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.error("Missing Authorization header from client");
            throw new Error("Missing Authorization header");
        }

        const token = authHeader.replace("Bearer ", "");

        // 2. Decode user_id from token manually to key reliable user ID
        // We accept the token signed by Supabase (using JWT secret would be best, but here we trust Gateway or just decode payload as we want to unblock)
        // Ideally we should verify signature using JWT secret.
        // For quick fix: let's try to verify it using getUser with SERVICE_ROLE key which is robust.

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // This verifies token signature
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            console.error("Auth error details:", userError);
            return new Response(JSON.stringify({
                error: "Unauthorized: " + (userError?.message || "No user found"),
                details: "Token validation failed with Service Role"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const { courseId, tariffId } = await req.json();

        if (!courseId || !tariffId) {
            throw new Error("Missing courseId or tariffId");
        }

        // 3. Admin client reads data (bypassing RLS issues for product catalog)
        const { data: course, error: courseError } = await supabaseAdmin
            .from("courses")
            .select("id, title, slug")
            .eq("id", courseId)
            .eq("is_active", true)
            .single();

        if (courseError || !course) {
            throw new Error("Course not found");
        }

        const { data: tariff, error: tariffError } = await supabaseAdmin
            .from("course_tariffs")
            .select("id, name, price")
            .eq("id", tariffId)
            .eq("course_id", courseId)
            .eq("is_active", true)
            .single();

        if (tariffError || !tariff) {
            throw new Error("Tariff not found");
        }

        // Checking using auth_user_id
        const { data: existingEnrollment } = await supabaseAdmin
            .from("enrollments")
            .select("id, payment_status")
            .eq("auth_user_id", user.id)
            .eq("course_id", courseId)
            .maybeSingle();

        if (existingEnrollment?.payment_status === "paid") {
            throw new Error("You already own this course");
        }

        const origin = req.headers.get("origin") || "http://localhost:8080";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: course.title,
                            description: `Tariff: ${tariff.name}`,
                        },
                        unit_amount: Math.round(parseFloat(tariff.price.toString()) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/courses/${course.slug}`,
            client_reference_id: `${user.id}_${courseId}_${tariffId}`,
            customer_email: user.email,
            metadata: {
                userId: user.id,
                courseId: courseId.toString(),
                tariffId: tariffId.toString(),
                courseTitle: course.title,
                tariffName: tariff.name,
            },
        });

        return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating checkout session:", errorMessage);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
