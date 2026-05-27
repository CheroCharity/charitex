import { supabase } from "@/services/supabaseClient";
import { computeStockByProduct } from "@/utils/inventory";

function isMissingStockColumnError(error, columnName) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("stock_transactions") && message.includes(columnName.toLowerCase());
}

async function attachUpdatedByEmails(transactions = []) {
  const updaterIds = [
    ...new Set(
      transactions
        .map((item) => item.updated_by || item.created_by || item.user_id)
        .filter(Boolean)
    ),
  ];

  if (updaterIds.length === 0) return transactions;

  const { data: profiles, error } = await supabase
    .from("users_profile")
    .select("id, email")
    .in("id", updaterIds);

  if (error) throw error;

  const emailById = (profiles || []).reduce((acc, item) => {
    acc[item.id] = item.email;
    return acc;
  }, {});

  return transactions.map((item) => {
    const updaterId = item.updated_by || item.created_by || item.user_id;
    return {
      ...item,
      updated_by_email: updaterId ? emailById[updaterId] || updaterId : "system",
    };
  });
}

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
  return attachUpdatedByEmails(data || []);
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

export async function getTotalInventoryValueAcrossBusinesses() {
  const [{ data: products, error: productsError }, { data: transactions, error: txError }] =
    await Promise.all([
      supabase.from("products").select("id, unit_price"),
      supabase.from("stock_transactions").select("product_id, quantity, type"),
    ]);

  if (productsError) throw productsError;
  if (txError) throw txError;

  const stockByProduct = (transactions || []).reduce((acc, tx) => {
    const productId = tx.product_id;
    if (!productId) return acc;

    if (!acc[productId]) acc[productId] = 0;
    if (tx.type === "IN") acc[productId] += Number(tx.quantity || 0);
    if (tx.type === "OUT") acc[productId] -= Number(tx.quantity || 0);
    return acc;
  }, {});

  return (products || []).reduce((acc, product) => {
    const currentStock = Number(stockByProduct[product.id] || 0);
    const unitPrice = Number(product.unit_price || 0);
    return acc + currentStock * unitPrice;
  }, 0);
}

export async function getTotalInvestedAmountAcrossBusinesses(filters = {}) {
  let query = supabase
    .from("stock_transactions")
    .select("type, quantity, buying_price_snapshot, unit_price_snapshot")
    .eq("type", "IN");

  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).reduce((acc, tx) => {
    const qty = Number(tx.quantity || 0);
    const buyingPrice = Number(tx.buying_price_snapshot || tx.unit_price_snapshot || 0);
    return acc + qty * buyingPrice;
  }, 0);
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

function validateNote(note) {
  if (!String(note || "").trim()) {
    throw new Error("Note is required. Include customer name and M-PESA transaction ID where applicable.");
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
  validateNote(payload.note);

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

  const insertPayload = {
    user_id: userId,
    business_id: businessId,
    created_by: userId,
    updated_by: userId,
    product_id: payload.productId,
    type: payload.type,
    payment_method: payload.type === "OUT" ? payload.paymentMethod : null,
    quantity,
    date: payload.date,
    note: String(payload.note || "").trim(),
    buying_price_snapshot: payload.type === "IN" ? buyingPrice : 0,
    selling_price_snapshot: sellingPrice,
    unit_price_snapshot: sellingPrice,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("stock_transactions")
    .insert([insertPayload])
    .select()
    .single();

  if (error && (isMissingStockColumnError(error, "updated_at") || isMissingStockColumnError(error, "updated_by"))) {
    const fallbackPayload = { ...insertPayload };
    delete fallbackPayload.updated_at;
    delete fallbackPayload.updated_by;

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("stock_transactions")
      .insert([fallbackPayload])
      .select()
      .single();

    if (fallbackError) throw fallbackError;
    return fallbackData;
  }

  if (error) throw error;
  return data;
}

async function ensureStockNotNegativeAfterEdit(existingTx, businessId, nextQuantity) {
  const { data: txList, error: txError } = await supabase
    .from("stock_transactions")
    .select("id, quantity, type")
    .eq("business_id", businessId)
    .eq("product_id", existingTx.product_id);

  if (txError) throw txError;

  const currentStockExcludingTx = (txList || []).reduce((acc, tx) => {
    if (tx.id === existingTx.id) return acc;
    if (tx.type === "IN") return acc + Number(tx.quantity || 0);
    return acc - Number(tx.quantity || 0);
  }, 0);

  if (currentStockExcludingTx - nextQuantity < 0) {
    throw new Error("Stock cannot go negative.");
  }
}

async function updateTransactionRow({ transactionId, businessId, updates }) {
  return supabase
    .from("stock_transactions")
    .update(updates)
    .eq("id", transactionId)
    .eq("business_id", businessId)
    .select()
    .single();
}

async function updateTransactionWithLegacyFallback({ transactionId, businessId, updates, error }) {
  if (!isMissingStockColumnError(error, "updated_at") && !isMissingStockColumnError(error, "updated_by")) {
    throw error;
  }

  const fallbackUpdates = { ...updates };
  delete fallbackUpdates.updated_at;
  delete fallbackUpdates.updated_by;

  const { data: fallbackData, error: fallbackError } = await updateTransactionRow({
    transactionId,
    businessId,
    updates: fallbackUpdates,
  });

  if (fallbackError) throw fallbackError;
  return fallbackData;
}

export async function updateTransaction({ transactionId, businessId, payload, actor }) {
  if (!transactionId) {
    throw new Error("Transaction ID is required.");
  }

  if (!actor?.isAdmin && !actor?.isSuperAdmin) {
    throw new Error("Only admins can edit transactions.");
  }

  if (!actor?.actorId) {
    throw new Error("Missing actor ID.");
  }

  const { data: existingTx, error: existingError } = await supabase
    .from("stock_transactions")
    .select("id, business_id, product_id, type")
    .eq("id", transactionId)
    .eq("business_id", businessId)
    .single();

  if (existingError || !existingTx) {
    throw new Error("Transaction not found.");
  }

  if (payload.productId !== existingTx.product_id || payload.type !== existingTx.type) {
    throw new Error("Changing transaction product or type is not allowed.");
  }

  const quantity = Number(payload.quantity);
  validateQuantity(quantity);
  validateNote(payload.note);

  const buyingPrice = Number(payload.buyingPrice || 0);
  const sellingPriceInput = Number(payload.sellingPrice || 0);
  validateTypeSpecificInputs(payload, buyingPrice, sellingPriceInput);

  if (existingTx.type === "OUT") {
    await ensureStockNotNegativeAfterEdit(existingTx, businessId, quantity);
  }

  let sellingPrice = 0;
  if (existingTx.type === "IN") {
    sellingPrice = sellingPriceInput;
    await updateProductSellingPrice(existingTx.product_id, businessId, sellingPrice);
  } else {
    const product = await loadProductForTransaction(existingTx.product_id, businessId);
    sellingPrice = Number(product.unit_price || 0);
  }

  const updates = {
    quantity,
    date: payload.date,
    note: String(payload.note || "").trim(),
    payment_method: existingTx.type === "OUT" ? payload.paymentMethod : null,
    buying_price_snapshot: existingTx.type === "IN" ? buyingPrice : 0,
    selling_price_snapshot: sellingPrice,
    unit_price_snapshot: sellingPrice,
    updated_by: actor.actorId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await updateTransactionRow({ transactionId, businessId, updates });
  if (error) {
    return updateTransactionWithLegacyFallback({ transactionId, businessId, updates, error });
  }

  return data;
}
