"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from "@/components/AlertProvider";
import { Camera } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  // ฟังก์ชันจัดการการเลือกรูป
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = "";

      // 1. อัปโหลดรูปภาพ (ถ้ามี)
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        // ได้ URL รูปภาพ
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      // 2. สมัครสมาชิก พร้อมบันทึกข้อมูลเสริม (Metadata)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name, // บันทึกชื่อ
            avatar_url: avatarUrl, // บันทึก URL รูป
          },
        },
      });

      if (signUpError) throw signUpError;

      showAlert(
        "สมัครสมาชิกสำเร็จ!",
        "กรุณาเข้าสู่ระบบด้วยบัญชีที่เพิ่งสร้าง",
        {
          type: "success",
          onOk: () => router.push("/login"),
        }
      );
    } catch (error) {
      console.error(error);
      showAlert(
        "สมัครสมาชิกไม่สำเร็จ",
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-stone-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            สร้างบัญชีใหม่
          </h1>
          <p className="text-stone-500">
            ร่วมเป็นส่วนหนึ่งของครอบครัว Baan Kanom
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* ส่วนอัปโหลดรูปโปรไฟล์ */}
          <div className="flex flex-col items-center mb-4">
            <label className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-stone-200 flex items-center justify-center">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-stone-400" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                เปลี่ยนรูป
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            <span className="text-xs text-stone-500 mt-2">
              รูปโปรไฟล์ (ถ้ามี)
            </span>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              ชื่อที่ใช้แสดง
            </label>
            <input
              type="text"
              placeholder="ชื่อเล่น หรือ ชื่อจริง"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl shadow-md hover:bg-stone-900 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-stone-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="text-stone-800 font-bold hover:underline"
          >
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}
