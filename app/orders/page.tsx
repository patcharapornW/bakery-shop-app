/**
 * หน้าแสดงประวัติการสั่งซื้อ
 * แสดงรายการคำสั่งซื้อ, สถานะ, รายละเอียดสินค้า, และสลิปการชำระเงิน
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ImageOff,
  MapPin,
  Phone,
  ReceiptText,
  Truck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ========== Types ==========

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  price: number;
  quantity: number;
  custom_options: Record<string, string> | null;
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_price: number;
  name: string;
  address: string;
  phone: string;
  note: string | null;
  slip_url: string | null;
  shipping_cost: number | null;
  promotion_code: string | null;
  discount_amount: number | null;
  order_items: OrderItem[];
};

type StatusMeta = {
  label: string;
  className: string;
  icon: LucideIcon;
  description: string;
};

// ========== Constants ==========

// กำหนดค่าสำหรับแต่ละสถานะคำสั่งซื้อ (สี, ไอคอน, คำอธิบาย)
const STATUS_BADGES: Record<string, StatusMeta> = {
  pending: {
    label: "กำลังตรวจสอบ",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-[0_1px_8px_rgba(245,158,11,0.25)]",
    icon: Clock3,
    description: "ร้านค้ารับคำสั่งซื้อแล้วและอยู่ระหว่างตรวจสอบการชำระเงิน",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    className:
      "bg-sky-50 text-sky-700 border border-sky-200/60 shadow-[0_1px_8px_rgba(14,165,233,0.25)]",
    icon: ReceiptText,
    description: "ยืนยันรายการเรียบร้อย กำลังเตรียมขนมของคุณ",
  },
  delivering: {
    label: "กำลังจัดส่ง",
    className:
      "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-[0_1px_8px_rgba(168,85,247,0.25)]",
    icon: Truck,
    description: "ขนมของคุณออกเดินทางเรียบร้อยแล้ว",
  },
  completed: {
    label: "จัดส่งสำเร็จ",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-[0_1px_8px_rgba(16,185,129,0.25)]",
    icon: CheckCircle2,
    description: "ส่งมอบความอร่อยให้คุณแล้ว ขอบคุณที่อุดหนุน",
  },
  cancelled: {
    label: "ยกเลิก",
    className:
      "bg-rose-50 text-rose-600 border border-rose-200/60 shadow-[0_1px_8px_rgba(225,29,72,0.2)]",
    icon: XCircle,
    description: "คำสั่งซื้อถูกยกเลิก หากมีคำถามสามารถติดต่อเราได้ทันที",
  },
};

/**
 * การตั้งค่าการเคลื่อนไหวสำหรับหน้า Orders Page
 */
const pageMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// หน้าประวัติการสั่งซื้อ

export default function OrdersPage() {
  const { user } = useSupabaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลคำสั่งซื้อทั้งหมดของผู้ใช้
  useEffect(() => {
    if (!user) return;
    let active = true;

    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) {
        console.error("fetchOrders error:", error);
        setOrders([]);
      } else {
        setOrders((data as Order[]) ?? []);
      }
      setLoading(false);
    };

    fetchOrders();

    return () => {
      active = false;
    };
  }, [user]);

  // แสดงผลตามสถานะ
  const renderState = () => {
    if (!user) {
      return (
        <motion.div
          {...pageMotion}
          className="text-center py-20 bg-white/70 border border-stone-100 rounded-3xl shadow-lg"
        >
          <p className="text-stone-500 mb-4">
            กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อและติดตามสถานะล่าสุด
          </p>
          <Link
            href="/login"
            className="inline-flex px-6 py-2.5 rounded-full bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </motion.div>
      );
    }

    if (loading) {
      return (
        <motion.div
          {...pageMotion}
          className="flex flex-col items-center justify-center py-20 gap-3 text-stone-500"
        >
          <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
          <p>กำลังโหลดประวัติคำสั่งซื้อ...</p>
        </motion.div>
      );
    }

    if (orders.length === 0) {
      return (
        <motion.div
          {...pageMotion}
          className="text-center py-20 bg-white/80 rounded-3xl border border-dashed border-stone-200 shadow-inner space-y-4"
        >
          <p className="text-stone-500">คุณยังไม่มีประวัติการสั่งซื้อ</p>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors shadow-md"
          >
            สำรวจเมนูขนมตอนนี้
          </Link>
        </motion.div>
      );
    }

    return (
      <div className="space-y-5">
        {orders.map((order, index) => {
          const statusInfo =
            STATUS_BADGES[order.status] ?? STATUS_BADGES["pending"];
          const StatusIcon = statusInfo.icon;

          return (
            <motion.article
              key={order.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="bg-white rounded-3xl shadow-xl border-2 border-stone-200/50 overflow-hidden hover:shadow-2xl transition-shadow"
            >
              {/* Torn Ticket Header  */}
              <div className="relative bg-gradient-to-br from-stone-800 via-stone-700 to-stone-800 px-4 md:px-6 pt-3 pb-5">
                {/* Torn edge effect */}
                <div className="absolute bottom-0 left-0 right-0 h-3">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 100 15"
                    preserveAspectRatio="none"
                  ></svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-300 font-semibold">
                      หมายเลขคำสั่งซื้อ
                    </p>
                    {/* ตัวเลขออเดอร์ที่มีพื้นหลังสวยงาม */}
                    <div className="inline-block">
                      <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-xl px-5 py-2 shadow-md border-2 border-amber-200/60 relative overflow-hidden">
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 opacity-5">
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 16px)",
                            }}
                          ></div>
                        </div>
                        <p className="text-xl md:text-2xl font-black text-stone-800 tracking-wider relative z-10">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-300">
                      <Clock3 className="w-3 h-3" />
                      <span className="font-medium">
                        {new Date(order.created_at).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full shadow-md ${statusInfo.className}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                    <p className="text-xs text-stone-300 max-w-sm md:text-right bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                      {statusInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                  {/* รายการสินค้าและสรุปราคา */}
                  <div className="space-y-6">
                    {/* รายการสินค้า Section */}
                    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl p-5 border-2 border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                          <ReceiptText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-stone-800">
                            รายการสินค้า
                          </h4>
                          <p className="text-xs text-stone-500">
                            ขนมทั้งหมดในคำสั่งซื้อนี้
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-4 text-sm bg-white rounded-xl p-4 border-2 border-blue-100/50 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-stone-900 mb-1">
                                {item.product_name}
                              </p>
                              <p className="text-stone-500 text-xs mb-2">
                                จำนวน {item.quantity} ชิ้น · ฿
                                {item.price.toFixed(2)}/ชิ้น
                              </p>
                              {item.custom_options && (
                                <div className="text-xs text-stone-600 bg-gradient-to-r from-stone-50 to-blue-50/50 border border-stone-200 rounded-lg p-2.5 space-y-1">
                                  {Object.entries(item.custom_options).map(
                                    ([key, value]) => (
                                      <div key={key} className="flex gap-2">
                                        <span className="capitalize font-medium text-stone-500">
                                          {key}:
                                        </span>
                                        <span className="text-stone-700 font-semibold">
                                          {value as string}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-stone-700 to-stone-900 bg-clip-text text-transparent shrink-0">
                              ฿{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* สรุปค่าใช้จ่าย Section */}
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/30 rounded-2xl p-5 border-2 border-emerald-200 shadow-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                          <CircleDollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-stone-800">
                            สรุปค่าใช้จ่าย
                          </h4>
                          <p className="text-xs text-stone-500">
                            ราคาที่คุณชำระเรียบร้อยแล้ว
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 space-y-3 border border-emerald-100">
                        {order.discount_amount ? (
                          <div className="flex justify-between items-center text-sm bg-green-50 rounded-lg p-2.5 border border-green-200">
                            <span className="text-green-700 font-semibold">
                              ส่วนลด
                              {order.promotion_code
                                ? ` (${order.promotion_code})`
                                : ""}
                            </span>
                            <span className="text-green-600 font-bold">
                              -฿{order.discount_amount.toFixed(2)}
                            </span>
                          </div>
                        ) : null}
                        {order.shipping_cost !== null && (
                          <div className="flex justify-between text-stone-600 text-sm">
                            <span>ค่าจัดส่ง</span>
                            <span className="font-semibold">
                              ฿{order.shipping_cost.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-lg p-3 mt-3 border-2 border-stone-700">
                          <span>ยอดรวมสุทธิ</span>
                          <span>฿{order.total_price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลจัดส่งและสลิป */}
                  <div className="space-y-5">
                    {/* ข้อมูลการจัดส่ง Section */}
                    <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 rounded-2xl p-5 border-2 border-purple-100 shadow-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-md">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-stone-800">
                            ข้อมูลการจัดส่ง
                          </h4>
                          <p className="text-xs text-stone-500">
                            ข้อมูลติดต่อและที่อยู่ปลายทาง
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-stone-800 font-bold bg-white rounded-lg p-3 border border-purple-100">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span>{order.name}</span>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-600">{order.phone}</span>
                        </div>
                        <p className="text-stone-700 leading-relaxed bg-white border-2 border-purple-100 rounded-xl p-4 font-medium">
                          {order.address}
                        </p>
                        {order.note && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                            <p className="text-xs text-amber-800 font-semibold mb-1">
                              หมายเหตุ:
                            </p>
                            <p className="text-xs text-amber-700">
                              {order.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* สลิปการชำระเงิน Section */}
                    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl p-5 border-2 border-amber-100 shadow-md">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                          <ReceiptText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-stone-800">
                            สลิปการชำระเงิน
                          </h4>
                          <p className="text-xs text-stone-500">
                            บันทึกการโอนล่าสุดของคำสั่งซื้อ
                          </p>
                        </div>
                      </div>
                      {order.slip_url ? (
                        <div className="relative w-full h-56 rounded-xl overflow-hidden group ring-2 ring-amber-200 shadow-lg">
                          <Image
                            src={order.slip_url}
                            alt="สลิปโอนเงิน"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between text-white text-sm px-4 py-4">
                            <span className="font-semibold">คลิกเพื่อขยาย</span>
                            <a
                              href={order.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold hover:bg-white/30 transition-colors"
                            >
                              เปิดสลิป
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="h-56 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
                          <ImageOff className="w-8 h-8 text-amber-300" />
                          <span className="font-medium">
                            ไม่มีสลิปแนบมาด้วย
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    );
  };

  return (
    <motion.section
      className="min-h-screen bg-[#fbf4eb] py-10 px-4"
      initial="initial"
      animate="animate"
      variants={pageMotion}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-4xl font-bold text-stone-900">
            ประวัติการสั่งซื้อของฉัน
          </h1>
          <p className="text-stone-500 max-w-2xl mx-auto">
            ตรวจสอบสถานะคำสั่งซื้อ รายการสินค้า
          </p>
        </motion.div>
        {renderState()}
      </div>
    </motion.section>
  );
}
