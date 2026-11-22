import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const googleSans = Google_Sans({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-google-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Doléances",
  description: "Le référendum permanent pour changer l'action publique.",
  openGraph: {
    title: "Doléances",
    description: "Le référendum permanent pour changer l'action publique.",
    siteName: "Doléances",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doléances",
    description: "Le référendum permanent pour changer l'action publique.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${googleSans.variable}`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
