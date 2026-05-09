"use client";

import dynamic from "next/dynamic";
import { CircularProgress, Container } from "@mui/material";

const LoginClient = dynamic(() => import("./LoginClient"), {
  ssr: false,
  loading: () => (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <CircularProgress />
    </Container>
  ),
});

export default function LoginNoSSR() {
  return <LoginClient />;
}
