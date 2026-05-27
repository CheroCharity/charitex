"use client";

import { useEffect, useState } from "react";
import { Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MovementFormDialog from "@/components/MovementFormDialog";
import MovementTable from "@/components/MovementTable";
import StatusDialog from "@/components/StatusDialog";
import { useAuth } from "@/contexts/AuthContext";
import { addTransaction, getProductsWithStock, getTransactions, updateTransaction } from "@/services/stockService";

export default function MovementsPage() {
  const { user, businessId, isAdmin, isSuperAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const canManageAllTransactions = isAdmin || isSuperAdmin;
  const allowedTypes = canManageAllTransactions ? ["IN", "OUT"] : ["OUT"];

  const handleOpenCreate = () => {
    setEditingTx(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTx(null);
  };

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
      setSaving(true);
      setError("");
      setSuccess("");
      if (!user?.id) {
        throw new Error("Missing user session.");
      }

      if (!form.productId || !form.date || !form.type || !form.quantity || !String(form.note || "").trim()) {
        throw new Error("Product, type, quantity, date, and note are required.");
      }

      if (!canManageAllTransactions && form.type !== "OUT") {
        throw new Error("Staff users can only create STOCK OUT transactions.");
      }

      if (editingTx?.id) {
        await updateTransaction({
          transactionId: editingTx.id,
          businessId,
          payload: form,
          actor: { isAdmin, isSuperAdmin, actorId: user.id },
        });
      } else {
        await addTransaction({ businessId, userId: user.id, payload: form });
      }

      setSuccess(editingTx?.id ? "Transaction updated successfully." : "Transaction added successfully.");
      handleCloseDialog();
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setError("");
    setEditingTx(row);
    setDialogOpen(true);
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Typography variant="h4" fontWeight={700}>
          Stock In/Out
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          onClick={handleOpenCreate}
          disabled={saving}
          fullWidth
          sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
        >
          {saving ? "Saving..." : "Add Transaction"}
        </Button>
      </Stack>

      <StatusDialog open={Boolean(error)} severity="error" message={error} onClose={() => setError("")} />
      <StatusDialog open={Boolean(success)} severity="success" message={success} onClose={() => setSuccess("")} />

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          Transaction History
        </Typography>
        <MovementTable rows={rows} canEdit={canManageAllTransactions} onEdit={handleEdit} />
      </Paper>

      <MovementFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreate}
        products={products}
        allowedTypes={allowedTypes}
        initialValues={editingTx}
        submitting={saving}
      />
    </Stack>
  );
}
