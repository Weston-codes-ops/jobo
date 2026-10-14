import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobo — Your career document library",
  description:
    "Keep your CVs, qualifications, certificates, and cover letters organized in one private library with version history.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
