"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningIcon from "@mui/icons-material/Warning";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
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

function dateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: dateInputValue(start),
    to: dateInputValue(now),
  };
}

export default function DashboardPage() {
  const { businessId } = useAuth();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, totalInventoryValue: 0, lowStockCount: 0 });
  const [paymentSummary, setPaymentSummary] = useState({ cashIn: 0, mpesaIn: 0 });
  const [period, setPeriod] = useState(() => getCurrentMonthRange());
  const [draftPeriod, setDraftPeriod] = useState(() => getCurrentMonthRange());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!businessId) return;

    async function load() {
      try {
        setError("");
        const [products, transactions] = await Promise.all([
          getProductsWithStock(businessId),
          getTransactions(businessId, period),
        ]);
        setSummary(computeInventorySummary(products));
        const payments = transactions.reduce(
          (acc, tx) => {
            if (tx.type !== "OUT") return acc;
            const amount = Number(tx.quantity || 0) * Number(tx.unit_price_snapshot || 0);
            if (tx.payment_method === "MPESA") {
              acc.mpesaIn += amount;
            } else if (tx.payment_method === "CASH") {
              acc.cashIn += amount;
            }
            return acc;
          },
          { cashIn: 0, mpesaIn: 0 }
        );
        setPaymentSummary(payments);
        setRows(transactions.slice(0, 8));
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      }
    }

    load();
  }, [businessId, period]);

  const handlePeriodChange = (field) => (event) => {
    setDraftPeriod((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const applyPeriod = () => {
    setPeriod(draftPeriod);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Dashboard
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Selected Period</Typography>
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
                value={draftPeriod.from}
                onChange={handlePeriodChange("from")}
                fullWidth
              />
            </Box>
            <Box>
              <TextField
                label="To"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={draftPeriod.to}
                onChange={handlePeriodChange("to")}
                fullWidth
              />
            </Box>
            <Box>
              <Button variant="outlined" onClick={applyPeriod} fullWidth>
                Apply Period
              </Button>
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        <Box>
          <StatCard
            title="Total Inventory Value"
            value={toCurrency(summary.totalInventoryValue)}
            icon={<AttachMoneyIcon color="primary" />}
          />
        </Box>
        <Box>
          <StatCard
            title="Total Products"
            value={summary.totalProducts}
            icon={<InventoryIcon color="primary" />}
          />
        </Box>
        <Box>
          <StatCard title="Low Stock Items" value={summary.lowStockCount} icon={<WarningIcon color="warning" />} />
        </Box>
        <Box>
          <StatCard title="Recent Movements" value={rows.length} icon={<SwapHorizIcon color="secondary" />} />
        </Box>
        <Box>
          <StatCard
            title="Cash In (Stock Out)"
            value={toCurrency(paymentSummary.cashIn)}
            icon={<AccountBalanceWalletIcon color="success" />}
          />
        </Box>
        <Box>
          <StatCard
            title="M-PESA In (Stock Out)"
            value={toCurrency(paymentSummary.mpesaIn)}
            icon={<PhoneIphoneIcon color="primary" />}
          />
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          Recent Stock Movements
        </Typography>
        <MovementTable rows={rows} />
      </Paper>
    </Stack>
  );
}
