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

    // Get all departments with SLA
    const { data: departments } = await supabase.from("departments").select("id, sla_hours");

    if (!departments) return new Response(JSON.stringify({ escalated: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let escalatedCount = 0;

    for (const dept of departments) {
      const slaMs = dept.sla_hours * 60 * 60 * 1000;
      const cutoff = new Date(Date.now() - slaMs).toISOString();

      // Find open/in_progress issues past SLA
      const { data: overdueIssues } = await supabase
        .from("issues")
        .select("id, title")
        .eq("department_id", dept.id)
        .in("status", ["open", "in_progress"])
        .lt("created_at", cutoff);

      if (overdueIssues && overdueIssues.length > 0) {
        for (const issue of overdueIssues) {
          // Escalate issue
          await supabase.from("issues").update({ status: "escalated" }).eq("id", issue.id);

          // Status log entry
          await supabase.from("status_logs").insert({
            issue_id: issue.id,
            old_status: "open",
            new_status: "escalated",
            note: "Auto-escalated: SLA exceeded",
          });

          // Notify admin users
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          if (adminRoles) {
            for (const admin of adminRoles) {
              await supabase.from("notifications").insert({
                user_id: admin.user_id,
                message: `Issue "${issue.title}" has been escalated - SLA exceeded`,
                type: "issue_escalated",
                issue_id: issue.id,
              });
            }
          }

          escalatedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ escalated: escalatedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-escalations error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
