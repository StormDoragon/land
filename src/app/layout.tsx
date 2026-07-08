import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getCountryScope } from "@/lib/geo";

export const metadata: Metadata = {
  title: "APlotInWeb — Own a Visible Piece of the Internet",
  description:
    "Buy your digital plot on the real-world map. Claim a spot from $5, add your name, logo and link, and resell your verified digital asset.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, scope] = await Promise.all([getSession(), getCountryScope()]);
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header
          user={
            session
              ? { displayName: session.displayName, email: session.email }
              : null
          }
          country={
            scope.country
              ? { code: scope.country.code, name: scope.country.name }
              : null
          }
          detected={
            scope.detected
              ? { code: scope.detected.code, name: scope.detected.name }
              : null
          }
        />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
