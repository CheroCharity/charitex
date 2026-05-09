/* eslint-disable react/prop-types */
import "./globals.css";
import AppProviders from "@/components/AppProviders";

export const metadata = {
  title: "Charitex",
  description: "Inventory tracking for small and medium businesses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
