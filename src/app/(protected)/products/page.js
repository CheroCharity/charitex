"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
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
import { useAuth } from "@/contexts/AuthContext";
import { createProduct, deleteProduct, updateProduct } from "@/services/productService";
import { getProductsWithStock } from "@/services/stockService";

export default function ProductsPage() {
  const { user, businessId, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku || "").toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [products, search]);

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
      setError("");
      if (!isAdmin) {
        throw new Error("Only business admins can manage products.");
      }
      if (!form.name || !form.category || !form.unitPrice) {
        throw new Error("Name, category, and unit price are required.");
      }

      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct({ businessId, userId: user.id, payload: form });
      }

      setDialogOpen(false);
      setEditing(null);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Failed to save product");
    }
  };

  const handleDelete = async () => {
    try {
      setError("");
      if (!isAdmin) {
        throw new Error("Only business admins can delete products.");
      }
      await deleteProduct(deleting.id);
      setDeleting(null);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
        <Typography variant="h4" fontWeight={700}>
          Products
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, category"
            size="small"
          />
          {isAdmin ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Add Product
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {isAdmin ? null : <Alert severity="info">You are a staff user. Product management is admin-only.</Alert>}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <ProductTable products={filtered} onEdit={handleEdit} onDelete={setDeleting} canManage={isAdmin} />

      {isAdmin ? (
        <ProductFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          initialValues={editing}
        />
      ) : null}

      {isAdmin ? (
        <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
          <DialogTitle>Delete product</DialogTitle>
          <DialogContent>
            Are you sure you want to delete <strong>{deleting?.name}</strong>? This also removes linked stock transactions.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  );
}
