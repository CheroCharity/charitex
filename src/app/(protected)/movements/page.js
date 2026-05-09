"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MovementFormDialog from "@/components/MovementFormDialog";
import MovementTable from "@/components/MovementTable";
import { useAuth } from "@/contexts/AuthContext";
import { addTransaction, getProductsWithStock, getTransactions } from "@/services/stockService";

export default function MovementsPage() {
  const { user, businessId, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!businessId) return;
    try {
      setError("");
      const [productList, transactionList] = await Promise.all([
        getProductsWithStock(businessId),
        getTransactions(businessId),
      ]);
      setProducts(productList);
      setRows(transactionList);
    } catch (err) {
      setError(err.message || "Failed to load stock movements");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleCreate = async (form) => {
    try {
      setError("");
      if (!form.productId || !form.date || !form.type || !form.quantity) {
        throw new Error("Product, type, quantity, and date are required.");
      }

      if (!isAdmin && form.type !== "OUT") {
        throw new Error("Staff users can only create STOCK OUT transactions.");
      }

      await addTransaction({ businessId, userId: user.id, payload: form });
      setDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to add transaction");
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
        <Typography variant="h4" fontWeight={700}>
          Stock In/Out
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Transaction
        </Button>
      </Stack>

      {isAdmin ? null : <Alert severity="info">You are a staff user. You can only post STOCK OUT transactions.</Alert>}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          Transaction History
        </Typography>
        <MovementTable rows={rows} />
      </Paper>

      <MovementFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        products={products}
        allowedTypes={isAdmin ? ["IN", "OUT"] : ["OUT"]}
      />
    </Stack>
  );
}
