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
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Unit Price (Snapshot)</TableCell>
            <TableCell align="right">Line Value</TableCell>
            <TableCell>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary" align="center" py={2}>
                  No transactions found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((tx) => {
              const snapshotPrice = Number(tx.unit_price_snapshot || 0);
              const lineValue = Number(tx.quantity || 0) * snapshotPrice;
              return (
                <TableRow key={tx.id} hover>
                  <TableCell>{format(new Date(tx.date), "yyyy-MM-dd")}</TableCell>
                  <TableCell>{tx.products?.name || "-"}</TableCell>
                  <TableCell>
                    <Chip label={tx.type} color={tx.type === "IN" ? "success" : "warning"} size="small" />
                  </TableCell>
                  <TableCell align="right">{tx.quantity}</TableCell>
                  <TableCell align="right">{toCurrency(snapshotPrice)}</TableCell>
                  <TableCell align="right">{toCurrency(lineValue)}</TableCell>
                  <TableCell>{tx.note || "-"}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
