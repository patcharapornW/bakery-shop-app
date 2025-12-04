/**
 * หน้าโปรโมชั่น
 * แสดงโปรโมชั่นต่างๆ และให้เก็บโค้ดส่วนลดไว้ใช้ได้
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Copy, Check, Tag, Sparkles, Gift } from "lucide-react";
import { useAlert } from "@/components/AlertProvider";
import {
  saveCoupon,
  isCouponSaved,
  removeSavedCoupon,
  getSavedCoupons,
} from "@/lib/couponUtils";

const PROMOTIONS = [
  {
    id: 1,
    title: "ซื้อ 3 แถม 1 (คัพเค้ก)",
    description: "เมื่อซื้อคัพเค้กรสใดก็ได้ครบ 3 ชิ้น รับฟรีทันที 1 ชิ้น!",
    code: "CUPCAKE3GET1",
    image:
      "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=800",
    validUntil: "31 ธ.ค. 2025",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 2,
    title: "ส่วนลดวันเกิด 10%",
    description:
      "รับส่วนลด 10% สำหรับทุกสินค้า (เฉพาะเดือนเกิดของคุณเท่านั้น)",
    code: "HBD10",
    image:
      "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&q=80&w=800",
    validUntil: "ตลอดทั้งปี",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 3,
    title: "ส่งฟรี! เมื่อสั่งครบ 500.-",
    description:
      "บริการจัดส่งฟรีภายในระยะทาง 10 กม. เมื่อยอดสั่งซื้อครบ 500 บาท",
    code: "FREEDEL",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e92277c6?auto=format&fit=crop&q=80&w=800",
    validUntil: "31 ธ.ค. 2025",
    color: "from-emerald-500 to-teal-500",
  },
];

export default function PromotionPage() {
  const { showAlert } = useAlert();
  const [savedCodes, setSavedCodes] = useState<Set<string>>(new Set());

  // โหลดโค้ดที่เก็บไว้
  useEffect(() => {
    const savedCoupons = getSavedCoupons();
    const codes = new Set<string>(savedCoupons.map((c) => c.code));
    // ใช้ queueMicrotask เพื่อหลีกเลี่ยง synchronous setState
    queueMicrotask(() => setSavedCodes(codes));
  }, []);

  // คัดลอกโค้ด
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showAlert("คัดลอกโค้ดแล้ว", `โค้ด ${code} ถูกคัดลอกไปยังคลิปบอร์ดแล้ว`, "success");
  };

  // เก็บโค้ด
  const handleSaveCoupon = (code: string, title: string) => {
    if (isCouponSaved(code)) {
      removeSavedCoupon(code);
      setSavedCodes((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
      showAlert("ลบโค้ดแล้ว", `ลบโค้ด ${code} ออกจากรายการที่เก็บไว้`, "info");
    } else {
      if (saveCoupon(code, title)) {
        setSavedCodes((prev) => new Set(prev).add(code));
        showAlert(
          "เก็บโค้ดสำเร็จ",
          `โค้ด ${code} ถูกเก็บไว้แล้ว สามารถใช้ได้ในหน้าเช็คเอ้าท์`,
          "success"
        );
      } else {
        showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเก็บโค้ดได้", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf4eb] py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-stone-700" />
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-wide">
              โปรโมชั่นพิเศษ
            </h1>
          </div>
          <p className="text-stone-600 text-lg">
            ดีลพิเศษที่เราตั้งใจมอบให้คุณ คลิกเพื่อเก็บโค้ดไว้ใช้ได้เลย
          </p>
        </motion.div>

        {/* Promotion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROMOTIONS.map((promo, index) => {
            const isSaved = savedCodes.has(promo.code);
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Image with gradient overlay */}
                <div className={`relative h-48 bg-gradient-to-br ${promo.color} overflow-hidden`}>
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {promo.validUntil}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">
                      {promo.title}
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {promo.description}
                    </p>
                  </div>

                  {/* Code Section */}
                  <div className="bg-stone-50 rounded-2xl p-4 border-2 border-dashed border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-stone-500" />
                        <span className="text-xs text-stone-500 font-medium">
                          โค้ดส่วนลด
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-xl px-4 py-3 border-2 border-stone-200">
                        <span className="text-lg font-bold text-stone-900 tracking-wider">
                          {promo.code}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="p-3 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                        title="คัดลอกโค้ด"
                      >
                        <Copy className="w-5 h-5 text-stone-700" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveCoupon(promo.code, promo.title)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        isSaved
                          ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                          : "bg-stone-900 text-white hover:bg-stone-800 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {isSaved ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          เก็บโค้ดแล้ว
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Gift className="w-4 h-4" />
                          เก็บโค้ด
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stone-600" />
            วิธีใช้งาน
          </h3>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex items-start gap-2">
              <span className="text-stone-400">•</span>
              <span>
                คลิกปุ่ม &ldquo;เก็บโค้ด&rdquo; เพื่อเก็บโค้ดส่วนลดไว้ใช้ในภายหลัง
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-stone-400">•</span>
              <span>
                โค้ดที่เก็บไว้จะแสดงในหน้าเช็คเอ้าท์ สามารถเลือกใช้ได้ทันที
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-stone-400">•</span>
              <span>
                โค้ด HBD10 ใช้ได้เฉพาะเดือนเกิดของคุณเท่านั้น
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-stone-400">•</span>
              <span>
                โค้ด CUPCAKE3GET1 จะคำนวณอัตโนมัติเมื่อสั่งคัพเค้ก 4 ชิ้น
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
