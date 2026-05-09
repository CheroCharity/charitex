/* eslint-disable react/prop-types */
"use client";

import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { format } from "date-fns";

function toCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function MovementTable({ rows }) {
  return (
    <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 980 }}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Type</TableCell>
            <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Payment</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
              Buying Price (Snapshot)
            </TableCell>
            <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
              Selling Price (Snapshot)
            </TableCell>
            <TableCell align="right">Line Value</TableCell>
            <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Typography color="text.secondary" align="center" py={2}>
                  No transactions found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((tx) => {
              const buyingSnapshotPrice = Number(tx.buying_price_snapshot || 0);
              const sellingSnapshotPrice = Number(tx.selling_price_snapshot || tx.unit_price_snapshot || 0);
              const lineValue = Number(tx.quantity || 0) * (tx.type === "IN" ? buyingSnapshotPrice : sellingSnapshotPrice);
              return (
                <TableRow key={tx.id} hover>
                  <TableCell>{format(new Date(tx.date), "yyyy-MM-dd")}</TableCell>
                  <TableCell>{tx.products?.name || "-"}</TableCell>
                  <TableCell>
                    <Chip label={tx.type} color={tx.type === "IN" ? "success" : "warning"} size="small" />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{tx.payment_method || "-"}</TableCell>
                  <TableCell align="right">{tx.quantity}</TableCell>
                  <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {toCurrency(buyingSnapshotPrice)}
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {toCurrency(sellingSnapshotPrice)}
                  </TableCell>
                  <TableCell align="right">{toCurrency(lineValue)}</TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>{tx.note || "-"}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
