import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AudioUnlock } from "@/components/AudioUnlock";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Shedding-style card game — play under the top card or host an online room",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased h-full overflow-hidden">
        <ThemeProvider>
          <AudioUnlock />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}