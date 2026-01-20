
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";
import { requireAuth, handleError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
    // Pre-flight check handled by requireAuth options check or manual check?
    // requireAuth throws response for OPTIONS, so we just catch it.

    try {
        // 1. Check Auth & Get Admin Client
        const { user, supabaseAdmin } = await requireAuth(req);

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            apiVersion: "2023-10-16",
        });

        const { courseId, tariffId } = await req.json();

        if (!courseId || !tariffId) {
            throw new Error("Missing courseId or tariffId");
        }

        // 2. Business Logic
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
        return handleError(error);
    }
});
