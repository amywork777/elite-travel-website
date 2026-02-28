import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { password, action, data } = body;

    // Validate password via check_admin_password RPC (uses pgcrypto bcrypt)
    const { data: isValid, error: authErr } = await supabase.rpc(
      "check_admin_password",
      { input_password: password }
    );

    if (authErr || !isValid) {
      return json({ error: "Invalid password" }, 401);
    }

    // Route to action
    switch (action) {
      case "list_all": {
        const { data: tours, error } = await supabase
          .from("tours")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json({ tours });
      }

      case "get_by_id": {
        const { data: tour, error } = await supabase
          .from("tours")
          .select("*")
          .eq("id", data.id)
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ tour });
      }

      case "create": {
        const { data: tour, error } = await supabase
          .from("tours")
          .insert(data.tour)
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ tour });
      }

      case "update": {
        const { data: tour, error } = await supabase
          .from("tours")
          .update(data.tour)
          .eq("id", data.id)
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ tour });
      }

      case "delete": {
        const { error } = await supabase
          .from("tours")
          .delete()
          .eq("id", data.id);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }

      case "upload_image": {
        const fileBytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
        const filePath = `tours/${data.tourId || "new"}/${Date.now()}-${data.fileName}`;
        const { data: upload, error } = await supabase.storage
          .from("tour-images")
          .upload(filePath, fileBytes, {
            contentType: data.contentType || "image/jpeg",
            upsert: false,
          });
        if (error) return json({ error: error.message }, 400);
        const { data: urlData } = supabase.storage
          .from("tour-images")
          .getPublicUrl(filePath);
        return json({ url: urlData.publicUrl });
      }

      case "bulk_create": {
        const { data: tours, error } = await supabase
          .from("tours")
          .insert(data.tours)
          .select();
        if (error) return json({ error: error.message }, 400);
        return json({ tours });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
