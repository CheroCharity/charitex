/* eslint-disable react/prop-types */
"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
};

export default function ProductFormDialog({ open, onClose, onSubmit, initialValues }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        sku: initialValues.sku || "",
        category: initialValues.category || "",
        unitPrice: String(initialValues.unit_price ?? ""),
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialValues, open]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValues ? "Edit Product" : "Add Product"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField label="Name" value={form.name} onChange={handleChange("name")} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="SKU (optional)" value={form.sku} onChange={handleChange("sku")} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Category" value={form.category} onChange={handleChange("category")} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Unit Price"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.unitPrice}
              onChange={handleChange("unitPrice")}
              fullWidth
              required
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
