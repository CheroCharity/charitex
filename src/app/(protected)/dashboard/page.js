"use client";

import { useEffect, useState } from "react";
import { Alert, Grid, Paper, Stack, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningIcon from "@mui/icons-material/Warning";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StatCard from "@/components/StatCard";
import MovementTable from "@/components/MovementTable";
import { useAuth } from "@/contexts/AuthContext";
import { getProductsWithStock, getTransactions } from "@/services/stockService";
import { computeInventorySummary } from "@/utils/inventory";

function toCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, totalInventoryValue: 0, lowStockCount: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      try {
        setError("");
        const [products, transactions] = await Promise.all([
          getProductsWithStock(user.id),
          getTransactions(user.id),
        ]);
        setSummary(computeInventorySummary(products));
        setRows(transactions.slice(0, 8));
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      }
    }

    load();
  }, [user?.id]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Dashboard
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Inventory Value"
            value={toCurrency(summary.totalInventoryValue)}
            icon={<AttachMoneyIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Products"
            value={summary.totalProducts}
            icon={<InventoryIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Low Stock Items" value={summary.lowStockCount} icon={<WarningIcon color="warning" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Recent Movements" value={rows.length} icon={<SwapHorizIcon color="secondary" />} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          Recent Stock Movements
        </Typography>
        <MovementTable rows={rows} />
      </Paper>
    </Stack>
  );
}
