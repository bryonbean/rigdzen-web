import type { Metadata } from "next";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ImpersonationBanner } from "./components/impersonation-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rigdzen - Retreat Coordination & Sangha Community Management",
  description:
    "Supporting Buddhist retreat coordination and sangha community management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ImpersonationBanner />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
