export function computeStockByProduct(products = [], transactions = []) {
  const txByProduct = transactions.reduce((acc, tx) => {
    if (!acc[tx.product_id]) acc[tx.product_id] = { in: 0, out: 0 };
    if (tx.type === "IN") {
      acc[tx.product_id].in += Number(tx.quantity || 0);
    } else if (tx.type === "OUT") {
      acc[tx.product_id].out += Number(tx.quantity || 0);
    }
    return acc;
  }, {});

  return products.map((product) => {
    const totals = txByProduct[product.id] || { in: 0, out: 0 };
    const currentStock = totals.in - totals.out;
    const stockValue = currentStock * Number(product.unit_price || 0);

    return {
      ...product,
      currentStock,
      stockValue,
      totalIn: totals.in,
      totalOut: totals.out,
    };
  });
}

export function computeInventorySummary(productsWithStock = []) {
  const totalProducts = productsWithStock.length;
  const totalInventoryValue = productsWithStock.reduce(
    (acc, item) => acc + Number(item.stockValue || 0),
    0
  );

  const lowStockCount = productsWithStock.filter((item) => item.currentStock <= 5).length;

  return {
    totalProducts,
    totalInventoryValue,
    lowStockCount,
  };
}
