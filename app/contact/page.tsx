"use client";

import { useState } from "react";
import { useAlert } from "@/components/AlertProvider";
import {
  Clock3,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { showAlert } = useAlert();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showAlert(
      "ส่งข้อความเรียบร้อย",
      `ขอบคุณครับคุณ ${form.name} เราได้รับข้อความแล้ว! (ระบบจำลอง)`,
      "success"
    );
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#fbf4eb] py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-3">ติดต่อเรา</h1>
          <p className="text-stone-500 text-lg">
            สอบถามข้อมูล สั่งทำเค้ก หรือติชมบริการ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ข้อมูลติดต่อ */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 h-fit">
            <h3 className="text-2xl font-bold text-stone-800 mb-6">
              ช่องทางการติดต่อ
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">ที่อยู่ร้าน</h4>
                  <p className="text-stone-600 text-sm mt-1">
                    123 ถนนสุขุมวิท แขวงคลองเตย <br /> เขตคลองเตย กรุงเทพมหานคร
                    10110
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">เบอร์โทรศัพท์</h4>
                  <p className="text-stone-600 text-sm mt-1">081-234-5678</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">LINE Official</h4>
                  <p className="text-stone-600 text-sm mt-1">@baankanom</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <Clock3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-700">เวลาทำการ</h4>
                  <p className="text-stone-600 text-sm mt-1">
                    เปิดทุกวัน: 08:00 - 20:00 น.
                  </p>
                </div>
              </div>
            </div>

            {/* แผนที่จำลอง */}
            <div className="mt-8 h-48 w-full bg-stone-200 rounded-xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute text-stone-500 font-bold flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                แผนที่ Google Maps
              </div>
            </div>
          </div>

          {/* ฟอร์มส่งข้อความ */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <h3 className="text-2xl font-bold text-stone-800 mb-6">
              ส่งข้อความถึงเรา
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  ชื่อของคุณ
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  ข้อความ
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="พิมพ์ข้อความของคุณที่นี่..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl shadow-md hover:bg-stone-900 transition-all transform active:scale-95"
              >
                ส่งข้อความ
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
