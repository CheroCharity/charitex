/* eslint-disable react/prop-types */
import "./globals.css";
import AppProviders from "@/components/AppProviders";

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><AppProviders>{children}</AppProviders></body></html>;
}
