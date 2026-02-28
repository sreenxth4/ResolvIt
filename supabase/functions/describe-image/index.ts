const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { image_base64, mime_type } = await req.json();

    if (!image_base64 || !mime_type) {
      return new Response(
        JSON.stringify({ error: "image_base64 and mime_type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use the working endpoint and header as per curl example
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
    console.log("Calling Gemini API (flash-latest), image mime:", mime_type, "base64 length:", image_base64.length);
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": geminiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are helping citizens report civic issues (potholes, broken pipes, garbage, streetlight outages, etc.) to local authorities.

Analyze this image and generate:
1. A short, clear issue title (max 15 words)
2. A detailed description of the civic issue shown (2-4 sentences). Include what the problem is, its apparent severity, and any safety concerns.
3. The most appropriate category from: roads, water, electricity, sanitation, public_safety, parks, other
4. A severity rating from 1-5 (1=Minor, 2=Low, 3=Moderate, 4=High, 5=Critical)

If the image does NOT show a civic issue, still try your best to describe what you see and suggest the closest category.

Respond ONLY in this exact JSON format, no markdown:
{"title": "...", "description": "...", "category": "...", "severity": 3}`,
              },
              {
                inline_data: {
                  mime_type: mime_type,
                  data: image_base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);

      if (geminiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI is temporarily busy. Please wait a minute and try again." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed", details: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON from Gemini's response (strip markdown fences if any)
    let parsed;
    try {
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          raw: rawText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        title: parsed.title || "",
        description: parsed.description || "",
        category: parsed.category || "other",
        severity: parsed.severity || 3,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("describe-image error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
