import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto",
  weight: ["400", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "Garden Account Lite",
  description: "ระบบบัญชีสวนไม้แบบง่าย",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Garden Lite",
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
      <body className={noto.variable}>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="brand">
                <span className="brand-mark">
                  <Image src="/nisa-leaf.png" alt="โลโก้ร้าน Nisa" width={42} height={42} priority />
                </span>
                <span className="brand-copy">
                  <strong>Garden Account Lite</strong>
                  <small>Nisa Garden</small>
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
