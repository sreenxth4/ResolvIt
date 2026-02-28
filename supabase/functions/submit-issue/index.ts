import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization");
    const accessToken = authHeader.replace("Bearer ", "").trim();
    if (!accessToken) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate and resolve caller from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) throw new Error("Unauthorized");

    const { title, description, category, severity, lat, lng, image_url } = await req.json();

    // Validate inputs
    if (!title || !description || !category || !lat || !lng) {
      throw new Error("Missing required fields");
    }

    // 1. Check for nearby duplicates (within ~100m, same category)
    const { data: nearbyIssues } = await supabase
      .from("issues")
      .select("id, title, description, lat, lng")
      .eq("category", category)
      .neq("status", "resolved")
      .gte("lat", lat - 0.001)
      .lte("lat", lat + 0.001)
      .gte("lng", lng - 0.001)
      .lte("lng", lng + 0.001);

    let duplicateIssueId: string | null = null;

    if (nearbyIssues && nearbyIssues.length > 0) {
      // Use AI to check semantic similarity
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

      if (LOVABLE_API_KEY) {
        try {
          const existingDescriptions = nearbyIssues
            .map((i, idx) => `Issue ${idx + 1} (ID: ${i.id}): "${i.title}" - "${i.description}"`)
            .join("\n");

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: "You are a duplicate issue detector. Compare a new civic issue with existing ones. Respond with ONLY a JSON object: {\"isDuplicate\": true/false, \"matchedIssueId\": \"id or null\"}. Consider issues as duplicates if they describe the same problem in the same area.",
                },
                {
                  role: "user",
                  content: `New issue: "${title}" - "${description}"\n\nExisting nearby issues:\n${existingDescriptions}\n\nIs the new issue a duplicate of any existing issue?`,
                },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "check_duplicate",
                    description: "Check if new issue is a duplicate",
                    parameters: {
                      type: "object",
                      properties: {
                        isDuplicate: { type: "boolean" },
                        matchedIssueId: { type: "string", description: "ID of matched issue or empty string" },
                      },
                      required: ["isDuplicate", "matchedIssueId"],
                      additionalProperties: false,
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "check_duplicate" } },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              const result = JSON.parse(toolCall.function.arguments);
              if (result.isDuplicate && result.matchedIssueId) {
                duplicateIssueId = result.matchedIssueId;
              }
            }
          }
        } catch (aiError) {
          console.error("AI duplicate check failed, proceeding with new issue:", aiError);
        }
      }
    }

    if (duplicateIssueId) {
      // Add as report to existing issue
      await supabase.from("issue_reports").insert({
        issue_id: duplicateIssueId,
        reporter_id: user.id,
        description,
        image_url,
      });

      // Increment report count
      await supabase.rpc("increment_report_count", { issue_id_param: duplicateIssueId });

      // Actually just update directly
      const { data: existingIssue } = await supabase.from("issues").select("report_count, severity, created_at, upvote_count").eq("id", duplicateIssueId).single();
      if (existingIssue) {
        const newReportCount = existingIssue.report_count + 1;
        const newPriority = (newReportCount * 2) + existingIssue.severity + Math.max(Math.floor((Date.now() - new Date(existingIssue.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0) + existingIssue.upvote_count;
        
        await supabase.from("issues").update({
          report_count: newReportCount,
          priority_score: newPriority,
        }).eq("id", duplicateIssueId);
      }

      // Award points for reporting
      await supabase.from("points_ledger").insert({
        user_id: user.id,
        points: 10,
        reason: "Duplicate issue report",
        issue_id: duplicateIssueId,
      });

      return new Response(
        JSON.stringify({ duplicate: true, issue_id: duplicateIssueId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Look up department based on category
    const categoryToDept: Record<string, string> = {
      roads: "Roads & Infrastructure",
      water: "Water & Sanitation",
      sanitation: "Water & Sanitation",
      electricity: "Electricity & Power",
    };
    const deptName = categoryToDept[category] || "Roads & Infrastructure";
    const { data: dept } = await supabase
      .from("departments")
      .select("id")
      .eq("name", deptName)
      .single();

    // 3. Create new issue
    const priorityScore = 2 + severity; // report_count(1)*2 + severity

    const { data: newIssue, error: insertError } = await supabase
      .from("issues")
      .insert({
        title,
        description,
        category,
        severity,
        lat,
        lng,
        image_url,
        reporter_id: user.id,
        priority_score: priorityScore,
        department_id: dept?.id || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Award points for new issue
    await supabase.from("points_ledger").insert({
      user_id: user.id,
      points: 10,
      reason: "New issue reported",
      issue_id: newIssue.id,
    });

    // Create initial status log
    await supabase.from("status_logs").insert({
      issue_id: newIssue.id,
      new_status: "open",
      changed_by: user.id,
    });

    return new Response(
      JSON.stringify({ duplicate: false, issue_id: newIssue.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("submit-issue error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
