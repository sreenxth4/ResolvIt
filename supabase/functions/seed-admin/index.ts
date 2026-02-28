import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = "admin@resolvit.com";
    const password = "admin123456";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      // Check if role exists
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", existing.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        // Delete existing citizen role if any
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", existing.id);

        await supabase
          .from("user_roles")
          .insert({ user_id: existing.id, role: "admin" });
      }

      return new Response(
        JSON.stringify({ message: "Admin already exists", user_id: existing.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new admin user
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: "Admin" },
      });

    if (createError) {
      throw createError;
    }

    const userId = newUser.user.id;

    // The handle_new_user trigger creates profile + citizen role automatically.
    // We need to update the role to admin.
    // Wait a moment for the trigger to fire
    await new Promise((r) => setTimeout(r, 500));

    // Update role to admin
    await supabase
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({ message: "Admin created", user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
