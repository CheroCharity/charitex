import { supabase } from "@/services/supabaseClient";

export async function getTeamUsers({ businessId, isSuperAdmin }) {
  let query = supabase
    .from("users_profile")
    .select("id, email, role, business_id, is_super_admin, is_active, created_at, businesses(name, is_frozen)")
    .order("created_at", { ascending: false });

  if (!isSuperAdmin) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBusinessUsers(businessId) {
  const { data, error } = await supabase
    .from("users_profile")
    .select("id, email, role, business_id, is_super_admin, is_active, created_at")
    .eq("business_id", businessId)
    .order("email", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAllBusinessAdmins() {
  const { data, error } = await supabase
    .from("users_profile")
    .select("id, email, role, business_id, is_super_admin, is_active, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBusinessesOverview() {
  const [{ data: businesses, error: businessError }, { data: users, error: usersError }] = await Promise.all([
    supabase.from("businesses").select("id, name, is_frozen, created_at").order("created_at", { ascending: false }),
    supabase.from("users_profile").select("business_id, role"),
  ]);

  if (businessError) throw businessError;
  if (usersError) throw usersError;

  const counts = (users || []).reduce((acc, row) => {
    if (!row.business_id) return acc;
    if (!acc[row.business_id]) {
      acc[row.business_id] = { admins: 0, staff: 0 };
    }
    if (row.role === "admin") acc[row.business_id].admins += 1;
    if (row.role === "staff") acc[row.business_id].staff += 1;
    return acc;
  }, {});

  return (businesses || []).map((business) => ({
    ...business,
    admins: counts[business.id]?.admins || 0,
    staff: counts[business.id]?.staff || 0,
  }));
}

export async function assignBusinessUserRole(targetUserId, role) {
  const { error } = await supabase.rpc("set_business_user_role", {
    target_user_id: targetUserId,
    new_role: role,
  });

  if (error) throw error;
}

export async function createBusinessAdmin(targetEmail, businessName) {
  const { data, error } = await supabase.rpc("super_admin_create_business_admin", {
    target_email: targetEmail,
    business_name: businessName,
  });

  if (error) throw error;
  return data;
}

export async function onboardBusiness({ businessName, adminEmail, staffEmails }) {
  const { data, error } = await supabase.rpc("super_admin_onboard_business", {
    business_name: businessName,
    admin_email: adminEmail,
    staff_emails: staffEmails,
  });

  if (error) throw error;
  return data;
}

export async function onboardUserAccount({ email, password, role, businessId }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in.");
  }

  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email, password, role, businessId }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to onboard user.");
  }

  return payload;
}

export async function setUserActiveStatus(targetUserId, isActive) {
  const { error } = await supabase.rpc("set_user_active_status", {
    target_user_id: targetUserId,
    make_active: isActive,
  });

  if (error) throw error;
}

export async function setBusinessFrozenStatus(targetBusinessId, isFrozen) {
  const { error } = await supabase.rpc("set_business_frozen_status", {
    target_business_id: targetBusinessId,
    freeze_business: isFrozen,
  });

  if (error) throw error;
}
