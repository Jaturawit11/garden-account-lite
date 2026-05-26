"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, ListFilter, PlusCircle, Truck } from "lucide-react";

const links = [
  { href: "/", label: "แดชบอร์ด", icon: Home },
  { href: "/add", label: "เพิ่ม", icon: PlusCircle },
  { href: "/transactions", label: "รายการ", icon: ListFilter },
  { href: "/shipping", label: "ฝากส่ง", icon: Truck },
  { href: "/summary", label: "สรุป", icon: BarChart3 }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="เมนูหลัก">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link key={link.href} className={`nav-link ${active ? "active" : ""}`} href={link.href}>
            <Icon aria-hidden />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
