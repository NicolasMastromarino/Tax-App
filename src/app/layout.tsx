import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Ten Minute Books",
  description: "Simple bookkeeping and tax planning for service-based businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif` }}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
