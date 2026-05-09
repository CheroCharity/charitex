/* eslint-disable react/prop-types */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from "@mui/icons-material/History";
import { supabase } from "@/services/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const drawerWidth = 250;

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeBusinessName, setActiveBusinessName] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isAdmin, isSuperAdmin, businessId, ownBusinessId } = useAuth();

  const isSwitchedContext = Boolean(isSuperAdmin && businessId && ownBusinessId && businessId !== ownBusinessId);

  useEffect(() => {
    async function loadBusinessName() {
      if (!businessId) {
        setActiveBusinessName("");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .maybeSingle();

      if (error) {
        setActiveBusinessName("Selected Business");
        return;
      }

      setActiveBusinessName(data?.name || "Selected Business");
    }

    loadBusinessName();
  }, [businessId]);

  const navItems = useMemo(
    () => {
      const base = [
        { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
        { label: "Products", href: "/products", icon: <Inventory2Icon /> },
        { label: "Stock In/Out", href: "/movements", icon: <SwapHorizIcon /> },
        { label: "Reports", href: "/reports", icon: <AssessmentIcon /> },
        { label: "Activity Logs", href: "/activity-logs", icon: <HistoryIcon /> },
      ];

      if (isAdmin || isSuperAdmin) {
        base.push({ label: "Team", href: "/team", icon: <GroupIcon /> });
      }

      if (isSuperAdmin) {
        base.push({ label: "Super Admin", href: "/super-admin", icon: <AdminPanelSettingsIcon /> });
      }

      return base;
    },
    [isAdmin, isSuperAdmin]
  );

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" fontWeight={700}>
          Charitex
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={pathname === item.href}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Inventory Management
            </Typography>
            {activeBusinessName ? (
              <Chip
                size="small"
                color={isSwitchedContext ? "warning" : "default"}
                label={`Business: ${activeBusinessName}`}
                sx={{ ml: 2 }}
              />
            ) : null}
          </Box>
          <Button color="inherit" onClick={handleSignOut}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
