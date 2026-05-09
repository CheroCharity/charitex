import { supabase } from "@/services/supabaseClient";

async function attachActorEmails(logs) {
  const userIds = [...new Set(logs.map((item) => item.user_id).filter(Boolean))];

  if (userIds.length === 0) return logs;

  const { data: profiles, error: profileError } = await supabase
    .from("users_profile")
    .select("id, email")
    .in("id", userIds);

  if (profileError) throw profileError;

  const emailByUserId = (profiles || []).reduce((acc, profile) => {
    acc[profile.id] = profile.email;
    return acc;
  }, {});

  return logs.map((item) => ({
    ...item,
    actor_email: item.user_id ? emailByUserId[item.user_id] || item.user_id : "system",
  }));
}

export async function getActivityLogs(businessId, options = {}) {
  const {
    from = "",
    to = "",
    action = "",
    page = 1,
    pageSize = 20,
    paginate = true,
  } = options;

  let query = supabase
    .from("activity_logs")
    .select("id, business_id, user_id, entity_table, entity_id, action, payload, created_at", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);
  if (action) query = query.eq("action", action);

  if (paginate) {
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;
    query = query.range(fromIndex, toIndex);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = await attachActorEmails(data || []);

  return {
    rows,
    total: count ?? rows.length,
    page,
    pageSize,
  };
}

export async function getActivityLogsForExport(businessId, options = {}) {
  const { rows } = await getActivityLogs(businessId, {
    ...options,
    paginate: false,
  });
  return rows;
}
