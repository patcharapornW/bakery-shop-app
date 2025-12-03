"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/components/AlertProvider";

export default function AuthForm({ onClose }: { onClose?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  // ฟังก์ชันส่งข้อมูล
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showAlert(
          "สมัครสมาชิกสำเร็จ",
          "โปรดตรวจสอบอีเมลเพื่อยืนยัน (ถ้ามี)",
          "success"
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      setEmail("");
      setPassword("");
      onClose?.();
    } catch (err) {
      //  จัดการ type error อย่างปลอดภัยโดยไม่ใช้ any
      if (err instanceof Error) {
        showAlert("เกิดข้อผิดพลาด", err.message, "error");
      } else {
        showAlert("เกิดข้อผิดพลาด", String(err), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-md w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-3">
        {mode === "sign-in" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full p-2 border rounded"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 rounded bg-brown-600 text-white"
          >
            {loading
              ? "กำลัง..."
              : mode === "sign-in"
              ? "เข้าสู่ระบบ"
              : "สมัคร"}
          </button>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </div>
      </form>
    </div>
  );
}
