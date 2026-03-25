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
      "bg-pink-50 text-pink-700 border border-pink-200 shadow-[0_2px_10px_rgba(255,141,161,0.15)]",
    icon: Clock3,
    description: "รับออเดอร์แล้ว อยู่ระหว่างตรวจสอบการโอนเงิน",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    className:
      "bg-white text-bakery-black border-2 border-bakery-black shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
    icon: ReceiptText,
    description: "ยืนยันยอดเงินแล้ว กำลังเตรียมความอร่อยให้คุณ",
  },
  delivering: {
    label: "กำลังจัดส่ง",
    className:
      "bg-bakery-pink text-white border border-pink-300 shadow-[0_4px_15px_rgba(255,141,161,0.3)]",
    icon: Truck,
    description: "ขนมของคุณกำลังเดินทางไปหาแล้วนะ",
  },
  completed: {
    label: "จัดส่งสำเร็จ",
    className:
      "bg-green-50 text-green-700 border border-green-200 shadow-[0_2px_10px_rgba(34,197,94,0.1)]",
    icon: CheckCircle2,
    description: "ส่งมอบความอร่อยเรียบร้อยแล้ว ขอบคุณที่อุดหนุนนะคะ",
  },
  cancelled: {
    label: "ยกเลิก",
    className:
      "bg-stone-50 text-stone-500 border border-stone-200 grayscale",
    icon: XCircle,
    description: "คำสั่งซื้อถูกยกเลิก ติดต่อเราได้หากมีข้อสงสัย",
  },
};

const pageMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function OrdersPage() {
  const { user } = useSupabaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderState = () => {
    if (!user) {
      return (
        <motion.div
          {...pageMotion}
          className="text-center py-24 bg-white rounded-[2rem] border border-pink-100 shadow-xl shadow-pink-500/5 max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock3 className="w-10 h-10 text-bakery-pink" />
          </div>
          <h2 className="text-2xl font-bold text-bakery-black mb-2">ต้องเข้าสู่ระบบก่อนนะคะ</h2>
          <p className="text-stone-500 mb-8 px-8">
            กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อและติดตามสถานะขนมของคุณได้ทันที
          </p>
          <Link
            href="/login"
            className="inline-flex px-10 py-4 rounded-2xl bg-bakery-black text-white font-bold hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
          >
            เข้าสู่ระบบเลย
          </Link>
        </motion.div>
      );
    }

    if (loading) {
      return (
        <motion.div
          {...pageMotion}
          className="flex flex-col items-center justify-center py-32 gap-4 text-stone-400"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-pink-100 rounded-full" />
            <div className="w-16 h-16 border-4 border-bakery-pink border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <p className="font-medium animate-pulse">กำลังโหลดความอร่อย...</p>
        </motion.div>
      );
    }

    if (orders.length === 0) {
      return (
        <motion.div
          {...pageMotion}
          className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-pink-100 shadow-xl shadow-pink-500/5 max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ReceiptText className="w-10 h-10 text-bakery-pink" />
          </div>
          <h2 className="text-2xl font-bold text-bakery-black mb-2">ยังไม่มีประวัติการสั่งซื้อ</h2>
          <p className="text-stone-500 mb-8">คุณยังไม่ได้สั่งขนมเลย สนใจลองชิมสักชิ้นไหมคะ?</p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-bakery-pink text-white font-bold hover:bg-pink-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/20"
          >
            ไปดูเมนูขนมกัน!
          </Link>
        </motion.div>
      );
    }

    return (
      <div className="space-y-8">
        {orders.map((order, index) => {
          const statusInfo =
            STATUS_BADGES[order.status] ?? STATUS_BADGES["pending"];
          const StatusIcon = statusInfo.icon;

          return (
            <motion.article
              key={order.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-[2.5rem] shadow-2xl shadow-pink-900/5 border border-pink-50 overflow-hidden hover:border-pink-200 transition-colors"
            >
              {/* Order Header */}
              <div className="bg-bakery-cream/50 px-6 md:px-10 py-8 border-b border-pink-50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-8 bg-bakery-pink rounded-full" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
                          ORDER RECORD
                        </p>
                        <h3 className="text-2xl md:text-3xl font-black text-bakery-black tracking-tight mt-1">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-pink-100">
                        <Clock3 className="w-3.5 h-3.5 text-bakery-pink" />
                        <span>
                          {new Date(order.created_at).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <div
                      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm ${statusInfo.className}`}
                    >
                      <StatusIcon className="w-5 h-5" />
                      {statusInfo.label}
                    </div>
                    <div className="text-xs text-stone-400 bg-white/80 px-4 py-2 rounded-xl border border-pink-50 font-medium max-w-[280px] lg:text-right">
                      {statusInfo.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6 md:p-10">
                <div className="grid gap-10 lg:grid-cols-[1.5fr,1fr]">
                  {/* Left Column: Items */}
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                          <ReceiptText className="w-4 h-4 text-bakery-pink" />
                        </div>
                        <h4 className="font-bold text-bakery-black text-lg">รายการขนมของคุณ</h4>
                      </div>

                      <div className="space-y-4">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="group flex gap-5 p-5 bg-bakery-cream/30 rounded-3xl border border-transparent hover:border-pink-100 hover:bg-white transition-all hover:shadow-xl hover:shadow-pink-500/5"
                          >
                            <div className="w-16 h-16 rounded-2xl bg-white border border-pink-50 flex items-center justify-center shrink-0 shadow-sm text-xl">
                              🍰
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-bakery-black text-lg group-hover:text-bakery-pink transition-colors">
                                  {item.product_name}
                                </p>
                                <span className="font-black text-bakery-black">
                                  ฿{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-stone-500 text-sm mb-3">
                                {item.quantity} ชิ้น · ฿{item.price.toLocaleString()} ต่อชิ้น
                              </p>
                              {item.custom_options && (
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                  {Object.entries(item.custom_options).map(([key, value]) => (
                                    <div key={key} className="bg-white px-2.5 py-1 rounded-full border border-pink-100 text-stone-600 font-bold uppercase tracking-wider">
                                      {key}: {value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Summary Card */}
                    <section className="bg-bakery-black text-white rounded-[2rem] p-8 shadow-2xl shadow-black/10 relative overflow-hidden group">
                      {/* Decorative pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-bakery-pink/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-bakery-pink/20 transition-all duration-700" />
                      
                      <div className="relative z-10 flex flex-col gap-4">
                        <div className="space-y-2 text-sm opacity-80">
                          {order.discount_amount ? (
                            <div className="flex justify-between items-center text-pink-300 font-bold">
                              <span>ส่วนลดพิเศษ {order.promotion_code ? `(${order.promotion_code})` : ""}</span>
                              <span>-฿{order.discount_amount.toLocaleString()}</span>
                            </div>
                          ) : null}
                          {order.shipping_cost !== null && (
                            <div className="flex justify-between items-center text-stone-400">
                              <span>ค่าจัดส่ง</span>
                              <span>฿{order.shipping_cost.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="h-px bg-white/10 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold">ยอดเงินสุทธิ</span>
                          <span className="text-3xl font-black text-bakery-pink">
                            ฿{order.total_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Delivery & Payment */}
                  <div className="space-y-6">
                    {/* Delivery Info */}
                    <div className="bg-white rounded-[2rem] border border-pink-100 p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-bakery-pink" />
                        </div>
                        <h4 className="font-bold text-bakery-black text-lg">ที่อยู่จัดส่ง</h4>
                      </div>
                      <div className="space-y-5">
                        <div className="bg-bakery-cream/50 rounded-2xl p-4 border border-pink-50">
                          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">ผู้รับ</p>
                          <div className="flex items-center gap-2 font-bold text-bakery-black">
                            <span>{order.name}</span>
                            <span className="text-stone-300">|</span>
                            <span>{order.phone}</span>
                          </div>
                        </div>
                        <div className="bg-bakery-cream/50 rounded-2xl p-4 border border-pink-50">
                          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">ที่อยู่ปลางทาง</p>
                          <p className="text-stone-700 leading-relaxed font-medium">
                            {order.address}
                          </p>
                        </div>
                        {order.note && (
                          <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100">
                            <p className="text-[10px] text-bakery-pink font-bold uppercase tracking-wider mb-1">
                              หมายเหตุถึงร้าน
                            </p>
                            <p className="text-stone-600 italic text-sm">
                              {order.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Receipt */}
                    <div className="bg-white rounded-[2rem] border border-pink-100 p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                          <CircleDollarSign className="w-4 h-4 text-bakery-pink" />
                        </div>
                        <h4 className="font-bold text-bakery-black text-lg">หลักฐานการชำระเงิน</h4>
                      </div>
                      
                      {order.slip_url ? (
                        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden group shadow-lg ring-1 ring-pink-50">
                          <Image
                            src={order.slip_url}
                            alt="สลิปโอนเงิน"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            <a
                              href={order.slip_url}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-white text-bakery-black px-6 py-2 rounded-full font-bold text-sm hover:bg-bakery-pink hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                            >
                              ดูรูปขนาดใหญ่
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/20 flex flex-col items-center justify-center text-stone-300 gap-3">
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-stone-200">
                            <ImageOff className="w-8 h-8" />
                          </div>
                          <span className="font-bold text-sm">ไม่พบเอกสารแนบ</span>
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
    <div className="min-h-screen bg-bakery-cream selection:bg-bakery-pink selection:text-white">
      <motion.section
        className="py-16 px-4 md:px-8"
        initial="initial"
        animate="animate"
        variants={pageMotion}
      >
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block bg-white px-4 py-1.5 rounded-full border border-pink-100 shadow-sm mb-2"
            >
              <span className="text-xs font-black tracking-[0.3em] text-bakery-pink uppercase">
                Order History
              </span>
            </motion.div>
            <h1 className="text-5xl font-black text-bakery-black tracking-tight">
              ติดตามออเดอร์
            </h1>
            <p className="text-stone-500 max-w-lg mx-auto font-medium">
              คุณสามารถตรวจสอบสถานะการจัดส่งและดูรายละเอียดการสั่งซื้อย้อนหลังได้ทั้งหมดในที่เดียว
            </p>
          </div>

          <div className="relative">
            {/* Soft decorative elements */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-bakery-pink/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              {renderState()}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer Quote */}
      <footer className="py-20 text-center opacity-30">
        <p className="font-mali text-stone-800 text-sm">Baan Kanom - Freshly baked with love every day</p>
      </footer>
    </div>
  );
}
