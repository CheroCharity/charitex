/* eslint-disable react/prop-types */
"use client";

import { Alert, Dialog, DialogContent } from "@mui/material";

export default function StatusDialog({ open, severity = "info", message = "", title = "", onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: { zIndex: 2100 },
        },
      }}
      sx={{ zIndex: 2200 }}
    >
      <DialogContent sx={{ p: 2, zIndex: 2201 }}>
        <Alert severity={severity} onClose={onClose} sx={{ width: "100%" }}>
          {title ? <strong>{title}</strong> : null}
          {title ? <br /> : null}
          {message}
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
