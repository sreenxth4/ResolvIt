import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Recalculate priorities for all unresolved issues
    const { data: issues } = await supabase
      .from("issues")
      .select("id, report_count, severity, created_at, upvote_count")
      .neq("status", "resolved");

    if (issues) {
      for (const issue of issues) {
        const daysUnresolved = Math.max(
          Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          0
        );
        const newPriority = (issue.report_count * 2) + issue.severity + daysUnresolved + issue.upvote_count;

        await supabase.from("issues").update({ priority_score: newPriority }).eq("id", issue.id);
      }
    }

    return new Response(
      JSON.stringify({ updated: issues?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("recalculate-priorities error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
