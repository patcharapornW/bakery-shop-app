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
              className="bg-white rounded-3xl shadow-lg border border-stone-100/80 p-6 md:p-8 ring-1 ring-stone-100 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-100 pb-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                    หมายเลขคำสั่งซื้อ
                  </p>
                  <p className="text-2xl font-bold text-stone-900 tracking-wide">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-stone-400">
                    {new Date(order.created_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full ${statusInfo.className}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </span>
                  <p className="text-xs text-stone-400 max-w-sm md:text-right">
                    {statusInfo.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
                {/* รายการสินค้าและสรุปราคา */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-stone-900/5 flex items-center justify-center text-stone-800">
                        <ReceiptText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-stone-600">
                          รายการสินค้า
                        </h4>
                        <p className="text-xs text-stone-400">
                          ขนมทั้งหมดในคำสั่งซื้อนี้
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 text-sm border border-stone-100 rounded-2xl p-4 shadow-sm"
                        >
                          <div>
                            <p className="font-semibold text-stone-800">
                              {item.product_name}
                            </p>
                            <p className="text-stone-400 text-xs">
                              จำนวน {item.quantity} ชิ้น · ฿
                              {item.price.toFixed(2)}
                            </p>
                            {item.custom_options && (
                              <div className="mt-2 text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded-xl p-2 space-y-1">
                                {Object.entries(item.custom_options).map(
                                  ([key, value]) => (
                                    <div key={key} className="flex gap-1">
                                      <span className="capitalize">{key}:</span>
                                      <span className="text-stone-600">
                                        {value as string}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-base font-bold text-stone-900 shrink-0">
                            ฿{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* สรุปค่าใช้จ่าย */}
                  <div className="rounded-2xl bg-stone-50 p-4 border border-stone-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center text-stone-700">
                        <CircleDollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-stone-600">
                          สรุปค่าใช้จ่าย
                        </h4>
                        <p className="text-xs text-stone-400">
                          ราคาที่คุณชำระเรียบร้อยแล้ว
                        </p>
                      </div>
                    </div>

                    <div className="text-sm space-y-2">
                      {order.discount_amount ? (
                        <div className="flex justify-between text-green-600">
                          <span>
                            ส่วนลด
                            {order.promotion_code
                              ? ` (${order.promotion_code})`
                              : ""}
                          </span>
                          <span>-฿{order.discount_amount.toFixed(2)}</span>
                        </div>
                      ) : null}
                      {order.shipping_cost !== null && (
                        <div className="flex justify-between text-stone-500">
                          <span>ค่าจัดส่ง</span>
                          <span>฿{order.shipping_cost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-100 pt-2 mt-2">
                        <span>ยอดรวมสุทธิ</span>
                        <span>฿{order.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ข้อมูลจัดส่งและสลิป */}
                <div className="space-y-5">
                  {/* ข้อมูลการจัดส่ง */}
                  <div className="rounded-2xl border border-stone-100 p-5 bg-gradient-to-br from-white to-stone-50/70 shadow-inner">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-stone-900/5 flex items-center justify-center text-stone-800">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-stone-600">
                          ข้อมูลการจัดส่ง
                        </h4>
                        <p className="text-xs text-stone-400">
                          ข้อมูลติดต่อและที่อยู่ปลายทาง
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-stone-700 font-semibold">
                        <Phone className="w-4 h-4 text-stone-400" />
                        {order.name} · {order.phone}
                      </div>
                      <p className="text-stone-600 leading-relaxed bg-white border border-stone-100 rounded-2xl p-3">
                        {order.address}
                      </p>
                      {order.note && (
                        <p className="text-xs text-stone-500 bg-white border border-dashed border-stone-200 rounded-2xl p-3">
                          หมายเหตุ: {order.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* สลิปการชำระเงิน */}
                  <div className="rounded-2xl border border-stone-100 p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-stone-900/5 flex items-center justify-center text-stone-800">
                        <ReceiptText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-stone-600">
                          สลิปการชำระเงิน
                        </h4>
                        <p className="text-xs text-stone-400">
                          บันทึกการโอนล่าสุดของคำสั่งซื้อ
                        </p>
                      </div>
                    </div>
                    {order.slip_url ? (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden group ring-1 ring-stone-100">
                        <Image
                          src={order.slip_url}
                          alt="สลิปโอนเงิน"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between text-white text-xs px-4 py-3">
                          <span>คลิกเพื่อขยาย</span>
                          <a
                            href={order.slip_url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-semibold"
                          >
                            เปิดสลิป
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
                        <ImageOff className="w-5 h-5" />
                        ไม่มีสลิปแนบมาด้วย
                      </div>
                    )}
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
