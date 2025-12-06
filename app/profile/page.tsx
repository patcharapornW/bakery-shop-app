"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useAlert } from "@/components/AlertProvider";
import { UserRound } from "lucide-react";

export default function ProfilePage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  // ใช้ useRef เพื่อควบคุม input file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [birthdayLocked, setBirthdayLocked] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setImagePreview(user.user_metadata?.avatar_url || null);
      // แปลงวันเกิดจาก ISO string เป็น format YYYY-MM-DD สำหรับ input type="date"
      if (user.user_metadata?.birthday) {
        try {
          const date = new Date(user.user_metadata.birthday);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          setBirthday(`${year}-${month}-${day}`);
          setBirthdayLocked(true); // ล็อควันเกิดเมื่อมีข้อมูลแล้ว
        } catch {
          setBirthday("");
          setBirthdayLocked(false);
        }
      } else {
        setBirthday("");
        setBirthdayLocked(false);
      }
    }
  }, [user]);

  //  ฟังก์ชันคลิกที่รูป -> ไปคลิก input file
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = user?.user_metadata?.avatar_url;

      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl,
          birthday: birthday ? new Date(birthday).toISOString() : null,
        },
      });

      if (updateError) throw updateError;

      showAlert("บันทึกข้อมูลสำเร็จ", "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว", {
        type: "success",
        onOk: () => {
          router.refresh();
          window.location.reload();
        },
      });
    } catch (error) {
      console.error(error);
      showAlert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="text-center py-20 text-stone-500">กำลังโหลดข้อมูล...</div>
    );

  return (
    <div className="min-h-screen bg-[#fbf4eb] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-md border border-stone-100 overflow-hidden">
        <div className="bg-stone-800 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">แก้ไขโปรไฟล์ส่วนตัว</h1>
          <p className="text-stone-300 text-sm mt-1">จัดการข้อมูลบัญชีของคุณ</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
          {/* ส่วนรูปโปรไฟล์ (แก้ไขใหม่) */}
          <div className="flex flex-col items-center">
            <div
              className="relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <div className="w-32 h-32 rounded-full border-4 border-stone-100 overflow-hidden bg-stone-50 shadow-inner relative">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <UserRound className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Overlay เมื่อ hover */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold border border-white px-3 py-1 rounded-full pointer-events-none">
                  เปลี่ยนรูป
                </span>
              </div>
            </div>

            {/*  Input File ซ่อนไว้ และใช้ ref อ้างถึง */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <p
              className="text-xs text-stone-400 mt-2 cursor-pointer hover:text-stone-600"
              onClick={handleAvatarClick}
            >
              คลิกที่รูปเพื่อเปลี่ยน
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">
                ชื่อที่ใช้แสดง
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all text-stone-800"
                placeholder="ชื่อเล่น หรือ ชื่อจริง"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">
                อีเมล (เปลี่ยนไม่ได้)
              </label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full p-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                <span>วันเกิด</span>
                <span className="text-stone-400 font-normal text-xs">
                  (สำหรับใช้โค้ด HBD10)
                </span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) =>
                    !birthdayLocked && setBirthday(e.target.value)
                  }
                  disabled={birthdayLocked}
                  max={new Date().toISOString().split("T")[0]}
                  className={`w-full p-4 bg-gradient-to-br ${
                    birthdayLocked
                      ? "from-stone-100 to-stone-50 border-2 border-stone-300"
                      : "from-blue-50 to-indigo-50 border-2 border-blue-200 focus:border-blue-400"
                  } rounded-xl outline-none focus:ring-2 focus:ring-blue-400 transition-all text-stone-800 font-semibold cursor-pointer disabled:cursor-not-allowed shadow-sm`}
                />
                {birthdayLocked && (
                  <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                    <span className="text-xs bg-stone-800 text-white px-3 py-1 rounded-full font-bold">
                      ไม่สามารถแก้ไขได้
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                {birthdayLocked ? (
                  <>
                    <span className="text-amber-600 font-semibold">
                      ไม่สามารถแก้ไขได้
                    </span>
                    <span>เพื่อความปลอดภัยของข้อมูล</span>
                  </>
                ) : (
                  <>
                    <span>กรุณากรอกวันเกิดเพื่อใช้โค้ด HBD10</span>
                    <span className="text-amber-600 font-semibold">
                      (ตั้งแล้วแก้ไขไม่ได้)
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                className="sm:flex-1 py-3 bg-white border-2 border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="sm:flex-[2] py-3 bg-stone-800 text-white font-bold rounded-xl shadow-md hover:bg-stone-900 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all"
            >
              ออกจากระบบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
