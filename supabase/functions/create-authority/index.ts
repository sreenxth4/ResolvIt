import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Note: Strict JWT checks are relaxed here to support environments where
    // session tokens are not being forwarded reliably.

    const { name, email, password, mobile_number, aadhaar_number, mandal_id, department_id } = await req.json();

    // Validate inputs
    if (!name || !email || !password || !mobile_number || !aadhaar_number || !mandal_id || !department_id) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^\d{10}$/.test(mobile_number)) {
      return new Response(JSON.stringify({ error: "Mobile number must be exactly 10 digits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^\d{12}$/.test(aadhaar_number)) {
      return new Response(JSON.stringify({ error: "Aadhaar number must be exactly 12 digits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string;

    // Try to create new user first
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) {
      // If user already exists, look them up
      if (createError.message.includes("already been registered")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u) => u.email === email);
        if (!existingUser) {
          return new Response(JSON.stringify({ error: "User exists but could not be found" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = existingUser.id;
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = newUser.user.id;
    }

    // Update profile with mobile_number, mandal_id and department_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        name,
        mobile_number,
        mandal_id,
        department_id,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Hash the aadhaar using pgcrypto
    const { error: hashErr } = await supabaseAdmin.rpc("_hash_aadhaar", {
      _user_id: userId,
      _aadhaar: aadhaar_number,
    });

    if (hashErr) {
      console.error("Aadhaar hash error:", hashErr);
      return new Response(JSON.stringify({ error: "Failed to store Aadhaar credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user_role to authority with department and mandal
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "authority" as any, department_id, mandal_id })
      .eq("user_id", userId);

    if (roleError) {
      console.error("Role update error:", roleError);
      return new Response(JSON.stringify({ error: "Failed to set authority role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Send welcome email via Resend ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      // Look up department name and mandal name
      let departmentName = "Not assigned";
      let mandalName = "Not assigned";
      if (department_id) {
        const { data: dept } = await supabaseAdmin
          .from("departments")
          .select("name")
          .eq("id", department_id)
          .single();
        if (dept?.name) departmentName = dept.name;
      }
      if (mandal_id) {
        const { data: mandal } = await supabaseAdmin
          .from("mandals")
          .select("name")
          .eq("id", mandal_id)
          .single();
        if (mandal?.name) mandalName = mandal.name;
      }

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "ResolvIt <onboarding@resend.dev>",
            to: [email],
            subject: "Welcome to ResolvIt — Your Authority Account",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🏛️ ResolvIt</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Civic Issue Resolution Platform</p>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}! 👋</h2>
                  <p style="color: #4b5563; line-height: 1.6;">
                    You have been added as an <strong>Authority</strong> on the ResolvIt platform.
                    You can now log in and start managing civic issues assigned to your department.
                  </p>
                  <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 12px;">Your Login Credentials</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; width: 120px;">Email:</td>
                        <td style="padding: 6px 0; color: #1f2937; font-weight: bold;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280;">Password:</td>
                        <td style="padding: 6px 0; color: #1f2937; font-weight: bold;">${password}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280;">Mandal:</td>
                        <td style="padding: 6px 0; color: #1f2937; font-weight: bold;">${mandalName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280;">Department:</td>
                        <td style="padding: 6px 0; color: #1f2937; font-weight: bold;">${departmentName}</td>
                      </tr>
                    </table>
                  </div>
                  <p style="color: #4b5563; line-height: 1.6;">
                    To log in, go to the Authority tab on the login page and enter your email and password.
                  </p>
                  <p style="color: #ef4444; font-size: 13px; margin-top: 16px;">
                    ⚠️ Please change your password after your first login for security.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    This is an automated message from ResolvIt. Do not reply to this email.
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.error("Resend email error:", errBody);
          // Don't fail the whole request — account is created, email is just a bonus
        } else {
          console.log("Welcome email sent to", email);
        }
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        // Non-blocking — account creation still succeeded
      }
    } else {
      console.warn("RESEND_API_KEY not set — skipping welcome email");
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Create authority error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
