/* eslint-disable react/prop-types */
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
  TextField,
} from "@mui/material";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
};

export default function ProductFormDialog({ open, onClose, onSubmit, initialValues, submitting = false }) {
  const [form, setForm] = useState(emptyForm);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

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
    if (submitting) return;
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{initialValues ? "Edit Product" : "Add Product"}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            mt: 0.5,
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField label="Name" value={form.name} onChange={handleChange("name")} fullWidth required />
          </Box>
          <Box>
            <TextField label="SKU (optional)" value={form.sku} onChange={handleChange("sku")} fullWidth />
          </Box>
          <Box>
            <TextField label="Category" value={form.category} onChange={handleChange("category")} fullWidth required />
          </Box>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              label="Unit Price"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.unitPrice}
              onChange={handleChange("unitPrice")}
              fullWidth
              required
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}>
        <Button onClick={onClose} fullWidth={fullScreen}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth={fullScreen}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
