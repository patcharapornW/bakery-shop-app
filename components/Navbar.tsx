/**
 * Navbar Component
 * แถบนำทาง: โลโก้, ลิงก์, ตะกร้า, ค้นหา, และเมนูผู้ใช้
 */

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthForm from "./AuthForm";
import { useSupabaseAuth } from "./useSupabaseAuth";
import Image from "next/image";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  LogOut,
  PencilLine,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Search,
  // 1. เพิ่ม MessageSquare icon สำหรับเมนูใหม่
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ========== Main Component ==========

export const Navbar = () => {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ค้นหาสินค้าและ redirect ไปหน้า /menu
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  // ดึงจำนวนสินค้าในตะกร้า (Real-time update)
  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      if (!user) {
        setCartCount(0);
        return;
      }
      const { data, error } = await supabase.rpc("get_cart_count");
      if (error) {
        console.error(error);
        return;
      }
      if (mounted) setCartCount(data ?? 0);
    }
    fetchCount();

    // ========== Real-time Subscription ==========
    // สร้าง Real-time channel เพื่ออัปเดตจำนวนสินค้าในตะกร้าแบบ Real-time
    let channel: RealtimeChannel | null = null;

    if (user) {
      channel = supabase
        .channel(`public:cart_items:user=${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // ฟังทุก event (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${user.id}`, // ฟังเฉพาะของ user นี้
          },
          () => fetchCount() // อัปเดตจำนวนเมื่อมีการเปลี่ยนแปลง
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel); // ลบ subscription
    };
  }, [user]);

  // ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
  useEffect(() => {
    let active = true;
    if (!user) {
      queueMicrotask(() => setIsAdmin(false));
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!active) return;
      if (error) {
        console.error("fetchRole error:", error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(data?.role === "admin");
    };

    fetchRole();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const userAvatar = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0];

  return (
    <>
      <nav className="bg-white/85 backdrop-blur border-b border-stone-100 sticky top-0 z-50 h-20 flex items-center shadow-sm">
        <div className="container mx-auto px-6 flex justify-between items-center w-full">
          <Link
            href="/"
            className="text-3xl font-bold text-stone-900 tracking-tight"
          >
            Baan Kanom
          </Link>

          <div className="hidden md:flex items-center space-x-6 font-semibold text-stone-600">
            <Link href="/" className="hover:text-stone-950 transition-colors">
              หน้าแรก
            </Link>
            <Link
              href="/menu"
              className="hover:text-stone-950 transition-colors"
            >
              สินค้าทั้งหมด
            </Link>
            <Link
              href="/promotion"
              className="hover:text-stone-950 transition-colors"
            >
              โปรโมชั่น
            </Link>
            <Link
              href="/contact"
              className="hover:text-stone-950 transition-colors"
            >
              ติดต่อเรา
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors group"
              aria-label="ค้นหาเมนู"
            >
              <Search className="h-6 w-6 text-stone-700 group-hover:text-stone-900 transition-colors" />
            </button>

            <Link href="/cart" className="relative group">
              <ShoppingBag className="h-7 w-7 text-stone-900 group-hover:text-stone-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 group relative cursor-pointer">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 relative bg-stone-100">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-bold">
                      {userName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="text-sm font-medium text-stone-700 hidden lg:block max-w-[100px] truncate">
                  {userName}
                </span>

                <div className="absolute right-0 top-full mt-0 w-56 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-stone-50 bg-stone-50/50">
                    <p className="text-xs text-stone-400 font-medium">
                      เข้าสู่ระบบโดย
                    </p>
                    <p className="text-sm font-bold text-stone-800 truncate">
                      {userName}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    className="px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center gap-2"
                  >
                    <PencilLine className="w-4 h-4" /> แก้ไขโปรไฟล์
                  </Link>

                  <Link
                    href="/orders"
                    className="px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center gap-2 border-t border-stone-50"
                  >
                    <ReceiptText className="w-4 h-4" /> ประวัติการสั่งซื้อ
                  </Link>

                  {isAdmin && (
                    <>
                      {/* 2. เพิ่มรายการ "ข้อความจากลูกค้า" เข้าไปในส่วน Admin และเปลี่ยนสีเป็นเขียว */}
                      <Link
                        href="/admin/messages"
                        className="px-4 py-3 text-sm text-green-600 hover:bg-green-50 hover:text-green-800 transition-colors flex items-center gap-2 border-t border-stone-50"
                      >
                        <MessageSquare className="w-4 h-4" /> ข้อความจากลูกค้า
                      </Link>
                      
                      {/* รายการ "จัดการสินค้า" เดิม */}
                      <Link
                        href="/admin"
                        className="px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" /> จัดการสินค้า
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-stone-50"
                  >
                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-full px-5 py-2 shadow-sm transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl">
            <AuthForm onClose={() => setShowAuth(false)} />
          </div>
        </div>
      )}

      {showSearch && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 md:pt-32 z-50 p-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาเมนูขนม..."
                    className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-stone-900 text-lg"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-lg"
                >
                  ค้นหา
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="px-4 py-4 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
              <p className="text-sm text-stone-500 text-center">
                กด Enter หรือคลิกปุ่มค้นหาเพื่อค้นหาเมนู
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
};