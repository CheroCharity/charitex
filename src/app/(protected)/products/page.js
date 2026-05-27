"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ProductTable from "@/components/ProductTable";
import ProductFormDialog from "@/components/ProductFormDialog";
import StatusDialog from "@/components/StatusDialog";
import { useAuth } from "@/contexts/AuthContext";
import { createProduct, deleteProduct, updateProduct } from "@/services/productService";
import { getProductsWithStock } from "@/services/stockService";

const filterProducts = (products, search) => {
  const term = search.toLowerCase().trim();
  if (!term) return products;

  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      (p.sku || "").toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
  );
};

const ensureAdminAccess = (isAdmin, message) => {
  if (!isAdmin) {
    throw new Error(message);
  }
};

const validateProductForm = (form) => {
  if (!form.name || !form.category || !form.unitPrice) {
    throw new Error("Name, category, and unit price are required.");
  }
};

const renderAdminAddProductButton = ({ isAdmin, submitting, onClick }) => {
  if (!isAdmin) return null;

  return (
    <Button
      variant="contained"
      startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
      onClick={onClick}
      disabled={submitting}
      fullWidth
      sx={{ whiteSpace: "nowrap" }}
    >
      {submitting ? "Saving..." : "Add Product"}
    </Button>
  );
};

const renderAdminProductDialogs = ({
  isAdmin,
  dialogOpen,
  onDialogClose,
  onSubmit,
  initialValues,
  submitting,
  deleting,
  deletingBusy,
  onDeleteCancel,
  onDelete,
}) => {
  if (!isAdmin) return null;

  return (
    <>
      <ProductFormDialog
        open={dialogOpen}
        onClose={onDialogClose}
        onSubmit={onSubmit}
        initialValues={initialValues}
        submitting={submitting}
      />

      <Dialog open={!!deleting} onClose={deletingBusy ? undefined : onDeleteCancel}>
        <DialogTitle>Delete product</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleting?.name}</strong>? This also removes linked stock transactions.
        </DialogContent>
        <DialogActions>
          <Button onClick={onDeleteCancel} disabled={deletingBusy}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={onDelete}
            disabled={deletingBusy}
            startIcon={deletingBusy ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deletingBusy ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default function ProductsPage() {
  const { user, businessId, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const filtered = useMemo(() => filterProducts(products, search), [products, search]);

  const loadProducts = async () => {
    if (!businessId) return;
    try {
      setError("");
      const list = await getProductsWithStock(businessId);
      setProducts(list);
    } catch (err) {
      setError(err.message || "Failed to load products");
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (product) => {
    if (!isAdmin) return;
    setEditing(product);
    setDialogOpen(true);
  };

  const handleSubmit = async (form) => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      ensureAdminAccess(isAdmin, "Only business admins can manage products.");
      validateProductForm(form);

      if (editing) {
        await updateProduct(editing.id, form);
        setSuccess("Product updated successfully.");
      } else {
        await createProduct({ businessId, userId: user.id, payload: form });
        setSuccess("Product added successfully.");
      }

      setDialogOpen(false);
      setEditing(null);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeletingBusy(true);
      setError("");
      setSuccess("");
      ensureAdminAccess(isAdmin, "Only business admins can delete products.");
      await deleteProduct(deleting.id);
      setSuccess("Product deleted successfully.");
      setDeleting(null);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Failed to delete product");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Typography variant="h4" fontWeight={700}>
          Products
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, category"
            size="small"
            fullWidth
            sx={{ width: "100%", maxWidth: { sm: 360 } }}
          />
          {renderAdminAddProductButton({ isAdmin, submitting, onClick: handleOpenCreate })}
        </Stack>
      </Stack>

      {isAdmin ? null : <Alert severity="info">You are a staff user. Product management is admin-only.</Alert>}
      <StatusDialog open={Boolean(error)} severity="error" message={error} onClose={() => setError("")} />
      <StatusDialog open={Boolean(success)} severity="success" message={success} onClose={() => setSuccess("")} />

      <ProductTable products={filtered} onEdit={handleEdit} onDelete={setDeleting} canManage={isAdmin} />

      {renderAdminProductDialogs({
        isAdmin,
        dialogOpen,
        onDialogClose: () => setDialogOpen(false),
        onSubmit: handleSubmit,
        initialValues: editing,
        submitting,
        deleting,
        deletingBusy,
        onDeleteCancel: () => setDeleting(null),
        onDelete: handleDelete,
      })}
    </Stack>
  );
}
