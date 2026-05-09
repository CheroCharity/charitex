/* eslint-disable react/prop-types */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

export default function MovementFormDialog({ open, onClose, onSubmit, products }) {
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    type: "IN",
    date: "",
    note: "",
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, date: prev.date || today }));
    }
  }, [open, today]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Stock Transaction</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
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
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="type-select">Type</InputLabel>
              <Select labelId="type-select" value={form.type} label="Type" onChange={handleChange("type")}>
                <MenuItem value="IN">STOCK IN</MenuItem>
                <MenuItem value="OUT">STOCK OUT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Quantity"
              type="number"
              inputProps={{ min: 1 }}
              value={form.quantity}
              onChange={handleChange("quantity")}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Note (optional)"
              value={form.note}
              onChange={handleChange("note")}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
