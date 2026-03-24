import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTenantSchema } from "@/lib/validations/tenant";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const result = createTenantSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert(result.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire provisioning webhook (non-blocking)
  const provisioningUrl = process.env.PROVISIONING_URL;
  const adminApiKey = process.env.PROVISIONING_API_KEY;
  if (provisioningUrl && adminApiKey) {
    fetch(`${provisioningUrl}/webhook/tenant-created`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": adminApiKey,
      },
      body: JSON.stringify({
        tenant_id: data.id,
        tenant_name: data.name,
        plan: data.plan,
      }),
    }).catch(() => {
      // Non-blocking — don't fail tenant creation if webhook fails
    });
  }

  return NextResponse.json(data, { status: 201 });
}
