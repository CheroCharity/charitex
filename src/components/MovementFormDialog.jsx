/* eslint-disable react/prop-types */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";

export default function MovementFormDialog({
  open,
  onClose,
  onSubmit,
  products,
  allowedTypes = ["IN", "OUT"],
  initialValues = null,
  submitting = false,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isEditMode = Boolean(initialValues?.id);
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    type: allowedTypes[0] || "OUT",
    paymentMethod: "",
    buyingPrice: "",
    sellingPrice: "",
    date: "",
    note: "",
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setForm({
          id: initialValues.id,
          productId: initialValues.product_id || "",
          quantity: String(initialValues.quantity ?? ""),
          type: initialValues.type || (allowedTypes[0] || "OUT"),
          paymentMethod: initialValues.payment_method || "",
          buyingPrice:
            initialValues.type === "IN"
              ? String(initialValues.buying_price_snapshot ?? "")
              : "",
          sellingPrice:
            initialValues.type === "IN"
              ? String(initialValues.selling_price_snapshot ?? initialValues.unit_price_snapshot ?? "")
              : "",
          date: initialValues.date || today,
          note: initialValues.note || "",
        });
        return;
      }

      setForm((prev) => {
        const nextType = allowedTypes.includes(prev.type) ? prev.type : (allowedTypes[0] || "OUT");
        return {
          ...prev,
          id: "",
          productId: "",
          quantity: "",
          date: prev.date || today,
          type: nextType,
          paymentMethod: nextType === "OUT" ? (prev.paymentMethod || "CASH") : "",
          buyingPrice: "",
          sellingPrice: "",
          note: "",
        };
      });
    }
  }, [open, today, allowedTypes, initialValues, isEditMode]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{isEditMode ? "Edit Stock Transaction" : "Add Stock Transaction"}</DialogTitle>
      <DialogContent>
        {isEditMode ? <Alert severity="info" sx={{ mb: 2 }}>Transaction type and product cannot be changed.</Alert> : null}
        <Box
          sx={{
            mt: 0.5,
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Box sx={{ gridColumn: "1 / -1" }}>
            <FormControl fullWidth>
              <InputLabel id="product-select">Product</InputLabel>
              <Select
                labelId="product-select"
                value={form.productId}
                label="Product"
                onChange={handleChange("productId")}
                disabled={isEditMode}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.currentStock})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth>
              <InputLabel id="type-select">Type</InputLabel>
              <Select labelId="type-select" value={form.type} label="Type" onChange={handleChange("type")} disabled={isEditMode}>
                {allowedTypes.includes("IN") ? <MenuItem value="IN">STOCK IN</MenuItem> : null}
                {allowedTypes.includes("OUT") ? <MenuItem value="OUT">STOCK OUT</MenuItem> : null}
              </Select>
            </FormControl>
          </Box>
          {form.type === "OUT" ? (
            <Box>
              <FormControl fullWidth>
                <InputLabel id="payment-method-select">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-select"
                  value={form.paymentMethod}
                  label="Payment Method"
                  onChange={handleChange("paymentMethod")}
                >
                  <MenuItem value="CASH">CASH</MenuItem>
                  <MenuItem value="MPESA">M-PESA</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ) : null}
          <Box>
            <TextField
              label="Quantity"
              type="number"
              // inputProps={{ min: 1 }}
              value={form.quantity}
              onChange={handleChange("quantity")}
              fullWidth
            />
          </Box>
          {form.type === "IN" ? (
            <>
              <Box>
                <TextField
                  label="Buying Price"
                  type="number"
                  // inputProps={{ min: 0, step: "0.01" }}
                  value={form.buyingPrice}
                  onChange={handleChange("buyingPrice")}
                  fullWidth
                />
              </Box>
              <Box>
                <TextField
                  label="Selling Price"
                  type="number"
                  // inputProps={{ min: 0, step: "0.01" }}
                  value={form.sellingPrice}
                  onChange={handleChange("sellingPrice")}
                  fullWidth
                />
              </Box>
            </>
          ) : null}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              label="Note"
              value={form.note}
              onChange={handleChange("note")}
              fullWidth
              multiline
              minRows={2}
              required
              placeholder="Enter customer name and M-PESA transaction ID (if applicable)."
              helperText="Required. Include customer name and M-PESA transaction ID for STOCK OUT payments."
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}>
        <Button onClick={onClose} fullWidth={fullScreen}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          fullWidth={fullScreen}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? "Saving..." : isEditMode ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
