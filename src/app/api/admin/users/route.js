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

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function forbidden(message) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function parsePayload(body) {
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const role = String(body?.role || "").trim().toLowerCase();
  const requestedBusinessId = body?.businessId ? String(body.businessId) : null;
  return { email, password, role, requestedBusinessId };
}

function validatePayload({ email, password, role }) {
  if (!email) return "Email is required.";
  if (!password || password.length < 8) return "Password must be at least 8 characters.";
  if (!["admin", "staff"].includes(role)) return "Role must be admin or staff.";
  return null;
}

async function getActorFromToken(url, anonKey, authHeader) {
  const actorClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: actorUser },
    error: actorError,
  } = await actorClient.auth.getUser();

  if (actorError || !actorUser) return null;
  return actorUser;
}

async function getActorProfile(adminClient, actorId) {
  const { data, error } = await adminClient
    .from("users_profile")
    .select("id, role, is_super_admin, is_active, business_id, businesses(is_frozen)")
    .eq("id", actorId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function ensureActorCanOnboard(actorProfile) {
  const actorIsSuper = !!actorProfile.is_super_admin;
  const actorIsAdmin = actorProfile.role === "admin";
  const actorIsActive = !!actorProfile.is_active;
  const actorBusinessFrozen = !!actorProfile.businesses?.is_frozen;

  if (!actorIsActive) return "Your account is deactivated.";
  if (!actorIsSuper && actorBusinessFrozen) return "Your business is currently frozen.";
  if (!actorIsSuper && !actorIsAdmin) return "Only admins can onboard users.";
  return null;
}

function resolveTargetBusinessId(actorProfile, requestedBusinessId) {
  if (actorProfile.is_super_admin) {
    if (!requestedBusinessId) return { error: "businessId is required for super admin onboarding." };
    return { value: requestedBusinessId };
  }

  if (requestedBusinessId && requestedBusinessId !== actorProfile.business_id) {
    return { error: "You can only onboard users into your own business." };
  }

  return { value: actorProfile.business_id };
}

async function ensureBusinessActive(adminClient, businessId) {
  const { data, error } = await adminClient
    .from("businesses")
    .select("id, is_frozen")
    .eq("id", businessId)
    .maybeSingle();

  if (error || !data) return "Target business not found.";
  if (data.is_frozen) return "Cannot onboard users into a frozen business.";
  return null;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return forbidden("Missing access token.");
    }

    const { url, anonKey, serviceRoleKey } = getSupabaseConfig();

    const actorUser = await getActorFromToken(url, anonKey, authHeader);
    if (!actorUser) {
      return forbidden("Invalid session.");
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const actorProfile = await getActorProfile(adminClient, actorUser.id);
    if (!actorProfile) {
      return forbidden("Actor profile not found.");
    }

    const actorAccessError = ensureActorCanOnboard(actorProfile);
    if (actorAccessError) {
      return forbidden(actorAccessError);
    }

    const payload = parsePayload(await request.json());
    const payloadError = validatePayload(payload);
    if (payloadError) {
      return badRequest(payloadError);
    }

    const businessResolution = resolveTargetBusinessId(actorProfile, payload.requestedBusinessId);
    if (businessResolution.error) {
      return actorProfile.is_super_admin ? badRequest(businessResolution.error) : forbidden(businessResolution.error);
    }
    const targetBusinessId = businessResolution.value;

    const businessStateError = await ensureBusinessActive(adminClient, targetBusinessId);
    if (businessStateError) {
      return badRequest(businessStateError);
    }

    const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        skip_default_business: true,
      },
    });

    if (createUserError || !created?.user?.id) {
      return badRequest(createUserError?.message || "Failed to create auth user.");
    }

    const newUserId = created.user.id;

    const { error: upsertError } = await adminClient
      .from("users_profile")
      .upsert(
        {
          id: newUserId,
          email: payload.email,
          business_id: targetBusinessId,
          role: payload.role,
          is_active: true,
          is_super_admin: false,
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      return badRequest(upsertError.message || "Failed to create user profile.");
    }

    await adminClient.from("activity_logs").insert([
      {
        business_id: targetBusinessId,
        user_id: actorUser.id,
        entity_table: "users_profile",
        entity_id: newUserId,
        action: "INSERT",
        payload: {
          email: payload.email,
          role: payload.role,
          is_active: true,
        },
      },
    ]);

    return NextResponse.json({ id: newUserId, email: payload.email, role: payload.role, businessId: targetBusinessId });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unexpected server error." }, { status: 500 });
  }
}
