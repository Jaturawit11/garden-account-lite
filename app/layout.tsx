import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Alex_Brush, Anuphan, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto",
  weight: ["400", "600", "700", "800"]
});

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  variable: "--font-anuphan",
  weight: ["400", "500", "600", "700"]
});

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  variable: "--font-alex",
  weight: "400"
});

export const metadata: Metadata = {
  title: "Accounting Nisa Plant",
  description: "ระบบบัญชีสวนไม้แบบง่าย",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nisa Plant",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/nisa-leaf.png",
    shortcut: "/nisa-leaf.png",
    apple: "/nisa-leaf.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f7d4b"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${noto.variable} ${anuphan.variable} ${alexBrush.variable}`}>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="brand">
                <span className="brand-mark">
                  <Image src="/nisa-leaf.png" alt="โลโก้ร้าน Nisa" width={54} height={54} priority />
                </span>
                <span className="brand-copy">
                  <strong>Accounting Nisa Plant</strong>
                  <small>บัญชีสวนไม้</small>
                </span>
              </div>
              <BottomNav />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
