"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MovementTable from "@/components/MovementTable";
import StatusDialog from "@/components/StatusDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions } from "@/services/stockService";

function toCsv(rows) {
  const headers = [
    "date",
    "product",
    "type",
    "payment_method",
    "quantity",
    "buying_price_snapshot",
    "selling_price_snapshot",
    "line_value",
    "note",
    "updated_by",
  ];
  const content = rows.map((tx) => {
    const buyingPrice = Number(tx.buying_price_snapshot || 0);
    const sellingPrice = Number(tx.selling_price_snapshot || tx.unit_price_snapshot || 0);
    const line = Number(tx.quantity || 0) * (tx.type === "IN" ? buyingPrice : sellingPrice);
    return [
      tx.date,
      tx.products?.name || "",
      tx.type,
      tx.payment_method || "",
      tx.quantity,
      buyingPrice,
      sellingPrice,
      line,
      (tx.note || "").replaceAll(",", " "),
      (tx.updated_by_email || "").replaceAll(",", " "),
    ].join(",");
  });

  return [headers.join(","), ...content].join("\n");
}

export default function ReportsPage() {
  const { businessId } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [rows]);

  const loadData = async () => {
    if (!businessId) return;
    try {
      setLoadingData(true);
      setError("");
      const data = await getTransactions(businessId, filters);
      setRows(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");
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
      setSuccess("Report exported successfully.");
    } catch (err) {
      setError(err.message || "Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = async () => {
    await loadData();
    setSuccess("Report filters applied.");
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Reports
      </Typography>

      <StatusDialog open={Boolean(error)} severity="error" message={error} onClose={() => setError("")} />
      <StatusDialog open={Boolean(success)} severity="success" message={success} onClose={() => setSuccess("")} />

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
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ justifyContent: { xs: "flex-start", sm: "flex-end" } }}
            >
              <Button
                variant="outlined"
                onClick={handleApplyFilters}
                fullWidth
                sx={{ width: { sm: "auto" } }}
                disabled={loadingData}
                startIcon={loadingData ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {loadingData ? "Applying..." : "Apply Filters"}
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={exporting}
                fullWidth
                sx={{ width: { sm: "auto" } }}
              >
                {exporting ? "Exporting..." : "Export CSV"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Paper>

      <MovementTable rows={sortedRows} />
    </Stack>
  );
}
