import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Own the World — Virtual Land Marketplace",
  description:
    "Buy virtual plots of land anywhere on the real-world map. Claim a city corner from $5, name it, and resell it.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header
          user={
            session
              ? { displayName: session.displayName, email: session.email }
              : null
          }
        />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
