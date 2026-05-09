import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, anonKey, serviceRoleKey };
}

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseStaff(staffInput) {
  if (!Array.isArray(staffInput)) return [];
  return staffInput
    .map((item) => ({
      email: String(item?.email || "").trim().toLowerCase(),
      password: String(item?.password || ""),
    }))
    .filter((item) => item.email);
}

async function getActor(url, serviceRoleKey, authHeader) {
  const accessToken = String(authHeader || "").replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return null;

  const actorClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await actorClient.auth.getUser(accessToken);

  if (error || !user) return null;
  return user;
}

async function upsertUserProfile(adminClient, { email, businessId, role, password }) {
  const existing = await adminClient
    .from("users_profile")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message || `Failed checking existing user for ${email}.`);
  }

  let userId = existing.data?.id || null;

  if (!userId) {
    if (!password || password.length < 8) {
      throw new Error(`Password for ${email} must be at least 8 characters.`);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { skip_default_business: true },
    });

    if (createError || !created?.user?.id) {
      throw new Error(createError?.message || `Failed to create auth user for ${email}.`);
    }

    userId = created.user.id;
  }

  const { error: upsertError } = await adminClient.from("users_profile").upsert(
    {
      id: userId,
      email,
      business_id: businessId,
      role,
      is_active: true,
      is_super_admin: false,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message || `Failed to upsert profile for ${email}.`);
  }

  return userId;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Missing access token.", 403);
    }

    const { url, serviceRoleKey } = getSupabaseConfig();
    const actor = await getActor(url, serviceRoleKey, authHeader);

    if (!actor) {
      return jsonError("Invalid session.", 403);
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: actorProfile, error: actorProfileError } = await adminClient
      .from("users_profile")
      .select("id, is_super_admin, is_active")
      .eq("id", actor.id)
      .maybeSingle();

    if (actorProfileError || !actorProfile?.is_super_admin) {
      return jsonError("Only super admins can onboard businesses.", 403);
    }

    if (!actorProfile.is_active) {
      return jsonError("Your account is deactivated.", 403);
    }

    const body = await request.json();
    const businessName = String(body?.businessName || "").trim();
    const adminEmail = String(body?.adminEmail || "").trim().toLowerCase();
    const adminPassword = String(body?.adminPassword || "");
    const staff = parseStaff(body?.staff);

    if (!businessName) return jsonError("Business name is required.");
    if (!adminEmail) return jsonError("Admin email is required.");

    const { data: business, error: businessError } = await adminClient
      .from("businesses")
      .insert([{ name: businessName, created_by: actor.id }])
      .select("id")
      .single();

    if (businessError || !business?.id) {
      return jsonError(businessError?.message || "Failed to create business.");
    }

    const businessId = business.id;

    const adminUserId = await upsertUserProfile(adminClient, {
      email: adminEmail,
      businessId,
      role: "admin",
      password: adminPassword,
    });

    const createdStaff = [];
    for (const member of staff) {
      const staffUserId = await upsertUserProfile(adminClient, {
        email: member.email,
        businessId,
        role: "staff",
        password: member.password,
      });
      createdStaff.push({ id: staffUserId, email: member.email });
    }

    await adminClient.from("activity_logs").insert([
      {
        business_id: businessId,
        user_id: actor.id,
        entity_table: "businesses",
        entity_id: businessId,
        action: "INSERT",
        payload: { name: businessName },
      },
      {
        business_id: businessId,
        user_id: actor.id,
        entity_table: "users_profile",
        entity_id: adminUserId,
        action: "UPDATE",
        payload: { role: "admin", email: adminEmail },
      },
    ]);

    return NextResponse.json({
      businessId,
      adminUserId,
      staffCount: createdStaff.length,
    });
  } catch (error) {
    return jsonError(error.message || "Unexpected server error.", 500);
  }
}
