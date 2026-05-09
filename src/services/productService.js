import { supabase } from "@/services/supabaseClient";

export async function getProducts(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProduct({ businessId, userId, payload }) {
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        user_id: userId,
        business_id: businessId,
        created_by: userId,
        name: payload.name,
        sku: payload.sku || null,
        category: payload.category,
        unit_price: Number(payload.unitPrice),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(productId, payload) {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: payload.name,
      sku: payload.sku || null,
      category: payload.category,
      unit_price: Number(payload.unitPrice),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}
