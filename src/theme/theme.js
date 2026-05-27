"use client";

import { createTheme } from "@mui/material/styles";

export function getAppTheme(mode = "light") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "rgba(226, 106, 75, 0.82)",
        light: "rgba(226, 106, 75, 0.68)",
        dark: "rgba(226, 106, 75, 0.94)",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "rgba(53, 35, 52, 0.78)",
        light: "rgba(53, 35, 52, 0.62)",
        dark: "rgba(53, 35, 52, 0.9)",
        contrastText: "#ffffff",
      },
      success: {
        main: "rgba(53, 35, 52, 0.78)",
      },
      info: {
        main: "rgba(53, 35, 52, 0.78)",
      },
      warning: {
        main: "#F59E0B",
      },
      error: {
        main: "#EF4444",
      },
      background: {
        default: mode === "light" ? "#F8FAFC" : "#0B1220",
        paper: mode === "light" ? "#FFFFFF" : "#0F172A",
      },
      text: {
        primary: mode === "light" ? "#0F172A" : "#E2E8F0",
        secondary: mode === "light" ? "#475569" : "#94A3B8",
      },
      divider: mode === "light" ? "#E2E8F0" : "#1E293B",
      action: {
        hover: mode === "light" ? "rgba(226, 106, 75, 0.05)" : "rgba(148,163,184,0.08)",
        selected: mode === "light" ? "rgba(226, 106, 75, 0.1)" : "rgba(226, 106, 75, 0.2)",
      },
    },
    shape: {
      borderRadius: 12,
    },
    zIndex: {
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1800,
      tooltip: 1900,
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontSize: "1.75rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h5: {
        fontSize: "1.375rem",
        fontWeight: 700,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 600,
      },
      body1: {
        fontSize: "0.95rem",
      },
      body2: {
        fontSize: "0.875rem",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === "light" ? "#F8FAFC" : "#0B1220",
            color: mode === "light" ? "#0F172A" : "#E2E8F0",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: "#ffffff",
            color: "#0F172A",
            borderBottom: "1px solid #E2E8F0",
            boxShadow: "none",
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: 72,
            paddingLeft: 20,
            paddingRight: 20,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: "rgba(226, 106, 75, 0.88)",
            color: "#E2E8F0",
            borderRight: "none",
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: "rgba(255,255,255,0.14)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
            border: "1px solid #E2E8F0",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 600,
            paddingInline: 16,
          },
          contained: {
            backgroundImage: "none",
            backgroundColor: "rgba(226, 106, 75, 0.86)",
            color: "#ffffff",
            boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
            "&:hover": {
              backgroundColor: "rgba(226, 106, 75, 0.96)",
              boxShadow: "0 6px 16px rgba(226,106,75,0.18)",
            },
          },
          outlined: {
            color: "rgba(226, 106, 75, 0.9)",
            borderColor: "#f3cabf",
            "&:hover": {
              borderColor: "rgba(226, 106, 75, 0.9)",
              backgroundColor: "rgba(226, 106, 75, 0.08)",
            },
          },
          text: {
            color: "rgba(226, 106, 75, 0.9)",
            "&:hover": {
              backgroundColor: "rgba(226, 106, 75, 0.08)",
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: "4px 10px",
            paddingTop: 10,
            paddingBottom: 10,
            color: "#E2E8F0",
            backgroundImage: "none",
            transition: "background-color 0.2s ease, color 0.2s ease",
            "&:hover": {
              backgroundImage: "none",
              backgroundColor: "rgba(53, 35, 52, 0.28)",
              color: "#FFFFFF",
            },
            "&.Mui-selected": {
              color: "#ffffff",
              backgroundImage: "none",
              backgroundColor: "rgba(53, 35, 52, 0.82)",
              "&:hover": {
                backgroundColor: "rgba(53, 35, 52, 0.92)",
              },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
            "& .MuiSvgIcon-root": {
              color: "#c7a7c5",
              fontSize: 18,
              transition: "color 0.2s ease",
            },
            ".MuiListItemButton-root:hover & .MuiSvgIcon-root, .MuiListItemButton-root.Mui-selected & .MuiSvgIcon-root": {
              color: "#ffffff",
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontSize: "0.92rem",
            fontWeight: 500,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            color: "#64748B",
            minHeight: 44,
            "&.Mui-selected": {
              color: "rgba(226, 106, 75, 0.9)",
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 3,
            backgroundImage: "none",
            backgroundColor: "rgba(226, 106, 75, 0.9)",
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: "#f3ebf3",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: "1px solid #E2E8F0",
            color: "#0F172A",
            paddingTop: 14,
            paddingBottom: 14,
          },
          head: {
            color: "#64748B",
            fontWeight: 600,
            fontSize: "0.8rem",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            backgroundColor: "#f3ebf3",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: "#f8f2f7",
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: "#FFFFFF",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#E2E8F0",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#CBD5E1",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(226, 106, 75, 0.9)",
              borderWidth: 1,
              boxShadow: "0 0 0 4px rgba(226, 106, 75, 0.08)",
            },
          },
          input: {
            paddingTop: 11,
            paddingBottom: 11,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "#64748B",
            "&.Mui-focused": {
              color: "rgba(226, 106, 75, 0.9)",
            },
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            zIndex: 1800,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            zIndex: 1800,
            position: "relative",
          },
        },
      },
    },
  });
}
