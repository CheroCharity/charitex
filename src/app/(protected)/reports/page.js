"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MovementTable from "@/components/MovementTable";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions } from "@/services/stockService";

function toCsv(rows) {
  const headers = ["date", "product", "type", "payment_method", "quantity", "unit_price_snapshot", "line_value", "note"];
  const content = rows.map((tx) => {
    const price = Number(tx.unit_price_snapshot || 0);
    const line = Number(tx.quantity || 0) * price;
    return [
      tx.date,
      tx.products?.name || "",
      tx.type,
      tx.payment_method || "",
      tx.quantity,
      price,
      line,
      (tx.note || "").replaceAll(",", " "),
    ].join(",");
  });

  return [headers.join(","), ...content].join("\n");
}

export default function ReportsPage() {
  const { businessId } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ from: "", to: "" });

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [rows]);

  const loadData = async () => {
    if (!businessId) return;
    try {
      setError("");
      const data = await getTransactions(businessId, filters);
      setRows(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleExport = () => {
    const csv = toCsv(sortedRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `charitex-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Reports
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            alignItems: "center",
          }}
        >
          <Box>
            <TextField
              label="From"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.from}
              onChange={handleFilterChange("from")}
              fullWidth
            />
          </Box>
          <Box>
            <TextField
              label="To"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.to}
              onChange={handleFilterChange("to")}
              fullWidth
            />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
              <Button variant="outlined" onClick={loadData}>
                Apply Filters
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
                Export CSV
              </Button>
            </Stack>
          </Box>
        </Box>
      </Paper>

      <MovementTable rows={sortedRows} />
    </Stack>
  );
}
