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

function validateQuantity(quantity) {
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }
}

function validateTypeSpecificInputs(payload, buyingPrice, sellingPriceInput) {
  if (payload.type === "OUT" && !payload.paymentMethod) {
    throw new Error("Payment method is required for STOCK OUT.");
  }

  if (payload.type !== "IN") return;

  if (!buyingPrice || buyingPrice <= 0) {
    throw new Error("Buying price is required for STOCK IN.");
  }

  if (!sellingPriceInput || sellingPriceInput <= 0) {
    throw new Error("Selling price is required for STOCK IN.");
  }
}

async function loadProductForTransaction(productId, businessId) {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, unit_price")
    .eq("id", productId)
    .eq("business_id", businessId)
    .single();

  if (error || !product) {
    throw new Error("Product not found.");
  }

  return product;
}

async function ensureStockNotNegative(productId, businessId, quantity) {
  const { data: txList, error: txError } = await supabase
    .from("stock_transactions")
    .select("quantity, type")
    .eq("business_id", businessId)
    .eq("product_id", productId);

  if (txError) throw txError;

  const currentStock = (txList || []).reduce((acc, tx) => {
    if (tx.type === "IN") return acc + Number(tx.quantity || 0);
    return acc - Number(tx.quantity || 0);
  }, 0);

  if (currentStock - quantity < 0) {
    throw new Error("Stock cannot go negative.");
  }
}

async function updateProductSellingPrice(productId, businessId, sellingPrice) {
  const { error } = await supabase
    .from("products")
    .update({ unit_price: sellingPrice })
    .eq("id", productId)
    .eq("business_id", businessId);

  if (error) throw error;
}

export async function addTransaction({ businessId, userId, payload }) {
  const quantity = Number(payload.quantity);
  validateQuantity(quantity);

  const buyingPrice = Number(payload.buyingPrice || 0);
  const sellingPriceInput = Number(payload.sellingPrice || 0);
  validateTypeSpecificInputs(payload, buyingPrice, sellingPriceInput);

  const product = await loadProductForTransaction(payload.productId, businessId);

  const sellingPrice = payload.type === "IN" ? sellingPriceInput : Number(product.unit_price || 0);

  if (payload.type === "OUT") {
    await ensureStockNotNegative(payload.productId, businessId, quantity);
  }

  if (payload.type === "IN") {
    await updateProductSellingPrice(payload.productId, businessId, sellingPrice);
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
        buying_price_snapshot: payload.type === "IN" ? buyingPrice : 0,
        selling_price_snapshot: sellingPrice,
        unit_price_snapshot: sellingPrice,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
