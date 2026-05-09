import { supabase } from "@/services/supabaseClient";
import { computeStockByProduct } from "@/utils/inventory";

export async function getTransactions(businessId, filters = {}) {
  let query = supabase
    .from("stock_transactions")
    .select("*, products(name, sku, category)")
    .eq("business_id", businessId)
    .order("date", { ascending: false });

  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  if (filters.productId) query = query.eq("product_id", filters.productId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProductsWithStock(businessId) {
  const [{ data: products, error: productsError }, { data: transactions, error: txError }] =
    await Promise.all([
      supabase.from("products").select("*").eq("business_id", businessId),
      supabase.from("stock_transactions").select("id, product_id, quantity, type").eq("business_id", businessId),
    ]);

  if (productsError) throw productsError;
  if (txError) throw txError;

  const list = computeStockByProduct(products || [], transactions || []);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function addTransaction({ businessId, userId, payload }) {
  const quantity = Number(payload.quantity);
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (payload.type === "OUT" && !payload.paymentMethod) {
    throw new Error("Payment method is required for STOCK OUT.");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, unit_price")
    .eq("id", payload.productId)
    .eq("business_id", businessId)
    .single();

  if (productError || !product) {
    throw new Error("Product not found.");
  }

  if (payload.type === "OUT") {
    const { data: txList, error: txError } = await supabase
      .from("stock_transactions")
      .select("quantity, type")
      .eq("business_id", businessId)
      .eq("product_id", payload.productId);

    if (txError) throw txError;

    const currentStock = (txList || []).reduce((acc, tx) => {
      if (tx.type === "IN") return acc + Number(tx.quantity || 0);
      return acc - Number(tx.quantity || 0);
    }, 0);

    if (currentStock - quantity < 0) {
      throw new Error("Stock cannot go negative.");
    }
  }

  const { data, error } = await supabase
    .from("stock_transactions")
    .insert([
      {
        user_id: userId,
        business_id: businessId,
        created_by: userId,
        product_id: payload.productId,
        type: payload.type,
        payment_method: payload.type === "OUT" ? payload.paymentMethod : null,
        quantity,
        date: payload.date,
        note: payload.note || null,
        unit_price_snapshot: Number(product.unit_price || 0),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
