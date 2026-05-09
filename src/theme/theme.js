"use client";

import { createTheme } from "@mui/material/styles";

export function getAppTheme(mode = "light") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#1565c0",
      },
      secondary: {
        main: "#7b1fa2",
      },
      background: {
        default: mode === "light" ? "#f5f7fb" : "#0f172a",
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: "0 3px 12px rgba(15, 23, 42, 0.08)",
          },
        },
      },
    },
  });
}
