/**
 * Bottom Navigation Bar สำหรับมือถือ
 * แสดงทุกหน้า ยกเว้นหน้า homepage
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, Gift, ShoppingCart, User } from "lucide-react";
import { useSupabaseAuth } from "./useSupabaseAuth";

export function BottomNavBar() {
  const pathname = usePathname();
  const { user } = useSupabaseAuth();

  // ไม่แสดงในหน้า homepage
  if (pathname === "/") {
    return null;
  }

  const navItems = [
    { href: "/", label: "หน้าแรก", icon: Home },
    { href: "/menu", label: "เมนู", icon: Menu },
    { href: "/promotion", label: "โปรโมชั่น", icon: Gift },
    { href: "/cart", label: "ตะกร้า", icon: ShoppingCart },
    { 
      href: user ? "/profile" : "/login", 
      label: user ? "โปรไฟล์" : "เข้าสู่ระบบ", 
      icon: User 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-stone-200 shadow-2xl z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          // ตรวจสอบ active state - รวม /login และ /profile
          const isActive = 
            pathname === item.href || 
            (pathname === "/login" && item.href === "/login") ||
            (pathname === "/profile" && item.href === "/profile");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? "text-stone-900 bg-stone-100 font-bold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

