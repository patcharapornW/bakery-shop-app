"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/components/AlertProvider";

export default function ForgotPasswordPage() {
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      showAlert("ส่งลิงก์ไม่สำเร็จ", error.message, "error");
    } else {
      showAlert(
        "เช็คอีเมลของคุณ",
        "เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้แล้ว",
        "success"
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg w-full max-w-md border border-stone-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            ลืมรหัสผ่าน?
          </h1>
          <p className="text-stone-500">
            กรอกอีเมลที่ใช้สมัครสมาชิกเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white font-bold rounded-lg shadow-md hover:bg-stone-900 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "ส่งลิงก์ตั้งรหัสผ่าน"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500 space-y-2">
          <Link href="/login" className="hover:text-stone-800 underline block">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
          <Link href="/" className="hover:text-stone-800 underline block">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

