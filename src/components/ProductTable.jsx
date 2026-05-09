/* eslint-disable react/prop-types */
"use client";

import {
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { format } from "date-fns";

function toCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function ProductTable({ products, onEdit, onDelete, canManage = true }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Unit Price</TableCell>
            <TableCell align="right">Current Stock</TableCell>
            <TableCell align="right">Stock Value</TableCell>
            <TableCell>Created</TableCell>
            {canManage ? <TableCell align="right">Actions</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canManage ? 8 : 7}>
                <Typography color="text.secondary" align="center" py={2}>
                  No products yet.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku || "-"}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell align="right">{toCurrency(product.unit_price)}</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    label={product.currentStock}
                    color={product.currentStock <= 5 ? "warning" : "default"}
                  />
                </TableCell>
                <TableCell align="right">{toCurrency(product.stockValue)}</TableCell>
                <TableCell>{format(new Date(product.created_at), "yyyy-MM-dd")}</TableCell>
                {canManage ? (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(product)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(product)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
