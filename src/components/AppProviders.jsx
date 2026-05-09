/* eslint-disable react/prop-types */
"use client";

import { useMemo, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AuthProvider } from "@/contexts/AuthContext";
import { getAppTheme } from "@/theme/theme";

export default function AppProviders({ children }) {
  const [mode] = useState("light");
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
