"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/components/AlertProvider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 text-center text-stone-500">
        กำลังเตรียมแบบฟอร์มตั้งรหัสผ่าน...
      </div>
    </div>
  );
}

function ResetPasswordPageInner() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const hasUrlRecovery = searchParams.get("type") === "recovery";
  const [hashRecoveryAccess, setHashRecoveryAccess] = useState(false);
  const [authRecoveryTriggered, setAuthRecoveryTriggered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const shouldEnable =
      url.searchParams.get("type") === "recovery" ||
      window.location.hash.includes("type=recovery");

    if (shouldEnable) {
      queueMicrotask(() => setHashRecoveryAccess(true));
    }
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthRecoveryTriggered(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const canRenderForm = hasUrlRecovery || hashRecoveryAccess || authRecoveryTriggered;

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newPassword || !confirmPassword) {
      return showAlert("ตั้งรหัสไม่สำเร็จ", "กรุณากรอกรหัสผ่านให้ครบ", "info");
    }
    if (newPassword !== confirmPassword) {
      return showAlert("รหัสผ่านไม่ตรงกัน", "กรุณาลองใหม่อีกครั้ง", "error");
    }
    if (newPassword.length < 8) {
      return showAlert(
        "รหัสสั้นเกินไป",
        "กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร",
        "error"
      );
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      return showAlert("ตั้งรหัสไม่สำเร็จ", error.message, "error");
    }

    showAlert(
      "ตั้งรหัสผ่านใหม่เรียบร้อย!",
      "โปรดเข้าสู่ระบบด้วยรหัสผ่านใหม่",
      "success",
      async () => {
        await supabase.auth.signOut();
        router.replace("/login");
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg w-full max-w-md border border-stone-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="text-stone-500">
            ตั้งรหัสผ่านใหม่เพื่อเข้าสู่ระบบอีกครั้ง
          </p>
        </div>

        {canRenderForm ? (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
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
                "บันทึกรหัสผ่านใหม่"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center text-sm text-stone-500 space-y-4">
            <p>
              ลิงก์ตั้งรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว กรุณาขอรหัสใหม่อีกครั้ง
            </p>
            <Link
              href="/forgot-password"
              className="text-stone-800 font-semibold underline"
            >
              ขอรหัสผ่านใหม่
            </Link>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-stone-500 space-y-2">
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

