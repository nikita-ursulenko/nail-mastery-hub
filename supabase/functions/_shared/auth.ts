
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const createAuthClient = (req: Request) => {
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    return supabaseAdmin;
}

export type AuthResult = {
    user: User;
    supabaseAdmin: SupabaseClient;
}

export const requireAuth = async (req: Request): Promise<AuthResult> => {
    if (req.method === "OPTIONS") {
        throw new Response("ok", { headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        throw new Error("Missing Authorization header");
    }

    const supabaseAdmin = createAuthClient(req);
    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        console.error("Auth error details:", userError);
        throw new Error("Unauthorized");
    }

    return { user, supabaseAdmin };
};

export const handleError = (error: any) => {
    // If the error was thrown by requireAuth OPTIONS check
    if (error instanceof Response) {
        return error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    // Log the specific error to Supabase logs for debugging 400s
    console.error("Edge Function Error:", message);
    if (error instanceof Error && error.stack) {
        console.error(error.stack);
    }

    const status = message === "Unauthorized" || message === "Missing Authorization header" ? 401 : 400;

    return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
    });
};
