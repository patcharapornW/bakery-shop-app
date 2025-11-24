"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useAlert } from "@/components/AlertProvider";

export default function LoginPage() {
  const { showAlert } = useAlert();
  const { user, isLoading } = useSupabaseAuth(); //ดึง user จาก Auth Hook มาเช็ค
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace("/"); // ใช้ replace เพื่อไม่ให้กด Back กลับมาได้
    }
  }, [user, router, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showAlert("เข้าสู่ระบบไม่สำเร็จ", error.message, "error");
    } else {
      // ✅ Login สำเร็จ
      showAlert("ยินดีต้อนรับ! ", "เข้าสู่ระบบเรียบร้อยแล้ว", "success", () => {
        router.push("/");
        router.refresh();
      });
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] p-4">
      {/* การ์ด Login */}
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg w-full max-w-md border border-stone-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            ยินดีต้อนรับ
          </h1>
          <p className="text-stone-500">เข้าสู่ระบบเพื่อสั่งขนมอร่อยๆ 🥐</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ✅ ปุ่ม Login (Primary Button) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white font-bold rounded-lg shadow-md hover:bg-stone-900 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        {/* เส้นคั่น */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-stone-400">หรือ</span>
          </div>
        </div>

        <Link href="/signup">
          <button
            type="button"
            disabled={loading}
            className="w-full py-3 bg-white border-2 border-stone-200 text-stone-600 font-bold rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-all duration-300"
          >
            สมัครสมาชิกใหม่
          </button>
        </Link>

        <div className="mt-6">
          <div className="text-sm text-stone-500">
            <Link
              href="/forgot-password"
              className="hover:text-stone-800 underline"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <div className="text-sm text-stone-500">
            <Link href="/" className="hover:text-stone-800 underline">
              กลับไปหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
