/* eslint-disable react/prop-types */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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

export default function MovementFormDialog({ open, onClose, onSubmit, products, allowedTypes = ["IN", "OUT"] }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
      setForm((prev) => {
        const nextType = allowedTypes.includes(prev.type) ? prev.type : (allowedTypes[0] || "OUT");
        return {
          ...prev,
          date: prev.date || today,
          type: nextType,
          paymentMethod: nextType === "OUT" ? (prev.paymentMethod || "CASH") : "",
          buyingPrice: nextType === "IN" ? prev.buyingPrice : "",
          sellingPrice: nextType === "IN" ? prev.sellingPrice : "",
        };
      });
    }
  }, [open, today, allowedTypes]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>Add Stock Transaction</DialogTitle>
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
            <FormControl fullWidth>
              <InputLabel id="product-select">Product</InputLabel>
              <Select
                labelId="product-select"
                value={form.productId}
                label="Product"
                onChange={handleChange("productId")}
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
              <Select labelId="type-select" value={form.type} label="Type" onChange={handleChange("type")}>
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
              inputProps={{ min: 1 }}
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
                  inputProps={{ min: 0, step: "0.01" }}
                  value={form.buyingPrice}
                  onChange={handleChange("buyingPrice")}
                  fullWidth
                />
              </Box>
              <Box>
                <TextField
                  label="Selling Price"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
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
              label="Note (optional)"
              value={form.note}
              onChange={handleChange("note")}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}>
        <Button onClick={onClose} fullWidth={fullScreen}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} fullWidth={fullScreen}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
