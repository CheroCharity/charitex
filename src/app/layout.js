/* eslint-disable react/prop-types */
import "./globals.css";
import { Inter } from "next/font/google";
import AppProviders from "@/components/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Charitex",
  description: "Inventory tracking for small and medium businesses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
