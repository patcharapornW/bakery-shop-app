"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/AlertProvider";
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
  Package,
  Search,
  Filter,
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
  user_id: string;
  order_items: OrderItem[];
  profiles?: {
    email: string;
    full_name: string | null;
  } | null;
};

type StatusMeta = {
  label: string;
  className: string;
  icon: LucideIcon;
  description: string;
  nextStatus?: string;
  nextLabel?: string;
};

// ========== Constants ==========

const STATUS_BADGES: Record<string, StatusMeta> = {
  pending: {
    label: "กำลังตรวจสอบ",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-[0_1px_8px_rgba(245,158,11,0.25)]",
    icon: Clock3,
    description: "ร้านค้ารับคำสั่งซื้อแล้วและอยู่ระหว่างตรวจสอบการชำระเงิน",
    nextStatus: "confirmed",
    nextLabel: "ยืนยันออเดอร์",
  },
  confirmed: {
    label: "ยืนยันแล้ว",
    className:
      "bg-sky-50 text-sky-700 border border-sky-200/60 shadow-[0_1px_8px_rgba(14,165,233,0.25)]",
    icon: ReceiptText,
    description: "ยืนยันรายการเรียบร้อย กำลังเตรียมขนมของคุณ",
    nextStatus: "delivering",
    nextLabel: "เริ่มจัดส่ง",
  },
  delivering: {
    label: "กำลังจัดส่ง",
    className:
      "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-[0_1px_8px_rgba(168,85,247,0.25)]",
    icon: Truck,
    description: "ขนมของคุณออกเดินทางเรียบร้อยแล้ว",
    nextStatus: "completed",
    nextLabel: "จัดส่งสำเร็จ",
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

const pageMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ========== Main Component ==========

export default function AdminOrdersPage() {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // ดึงข้อมูลออเดอร์ทั้งหมด
  const fetchOrders = async () => {
    try {
      console.log("Fetching orders...");
      
      // ลองดึง orders ก่อน (ไม่ join profiles)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Orders query error:", ordersError);
        throw ordersError;
      }

      console.log("Orders fetched:", ordersData?.length || 0);

      // ถ้ามี orders ให้ดึง profiles แยก
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map((o: Order) => o.user_id))];
        console.log("Fetching profiles for users:", userIds);

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        if (profilesError) {
          console.warn("Profiles query error (non-critical):", profilesError);
          // ไม่ throw error เพราะ profiles เป็น optional
        }

        // Map profiles ไปยัง orders
        const profilesMap = new Map(
          (profilesData || []).map((p: { id: string; email: string; full_name: string | null }) => [p.id, p])
        );

        const ordersWithProfiles = ordersData.map((order: Order) => ({
          ...order,
          profiles: profilesMap.get(order.user_id) || null,
        }));

        setOrders(ordersWithProfiles as Order[]);
      } else {
        setOrders([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching orders:", error);
      console.error("Error type:", typeof error);
      
      const errorObj = error as { message?: string; code?: string; hint?: string };
      const errorMessage = 
        errorObj?.message || 
        errorObj?.code || 
        errorObj?.hint ||
        (error instanceof Error ? error.message : String(error)) ||
        "ไม่ทราบสาเหตุ";
      
      showAlert(
        "เกิดข้อผิดพลาด", 
        `ไม่สามารถโหลดออเดอร์ได้: ${errorMessage}`, 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบสิทธิ์ Admin
  useEffect(() => {
    // รอให้ auth loading เสร็จก่อน
    if (authLoading) return;

    async function checkAdmin() {
      if (!user) {
        router.replace("/login");
        return;
      }

      console.log('Checking admin for user:', user.id, user.email);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log('Profile query result:', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
        showAlert('เกิดข้อผิดพลาด', `ไม่สามารถตรวจสอบสิทธิ์ได้: ${error.message}`, 'error');
        return;
      }

      if (!data) {
        console.error('No profile found for user:', user.id);
        showAlert('เข้าไม่ได้', 'ไม่พบข้อมูลโปรไฟล์ กรุณาติดต่อผู้ดูแลระบบ', 'error', () => router.replace('/'));
        return;
      }

      if (data.role !== "admin") {
        console.log('User is not admin. Role:', data.role);
        showAlert(
          "เข้าไม่ได้",
          "คุณไม่มีสิทธิ์เข้าถึงหน้านี้!",
          "error",
          () => router.replace("/")
        );
        return;
      }

      console.log('Admin access granted');
      setIsAdmin(true);
      fetchOrders();
    }

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, showAlert]);

  // เปลี่ยนสถานะออเดอร์
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      showAlert("สำเร็จ", "อัปเดตสถานะออเดอร์เรียบร้อยแล้ว", "success");
      fetchOrders(); // รีเฟรชข้อมูล
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตสถานะได้", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // กรองออเดอร์ตามสถานะและค้นหา
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.order_items.some((item) =>
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  // นับจำนวนออเดอร์ตามสถานะ
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    delivering: orders.filter((o) => o.status === "delivering").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (authLoading || !isAdmin || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.section
      className="min-h-screen bg-[#fbf4eb] py-10 px-4"
      initial="initial"
      animate="animate"
      variants={pageMotion}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-4xl font-bold text-stone-900 flex items-center justify-center gap-3">
            <Package className="w-10 h-10 text-stone-700" />
            จัดการออเดอร์ทั้งหมด
          </h1>
          <p className="text-stone-500 max-w-2xl mx-auto">
            ดูและจัดการคำสั่งซื้อทั้งหมดจากลูกค้า
          </p>
        </motion.div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยเลขออเดอร์, ชื่อลูกค้า, เบอร์โทร, หรือชื่อสินค้า..."
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-stone-500" />
              {[
                { value: "all", label: "ทั้งหมด", count: statusCounts.all },
                { value: "pending", label: "รอตรวจสอบ", count: statusCounts.pending },
                { value: "confirmed", label: "ยืนยันแล้ว", count: statusCounts.confirmed },
                { value: "delivering", label: "กำลังจัดส่ง", count: statusCounts.delivering },
                { value: "completed", label: "สำเร็จ", count: statusCounts.completed },
                { value: "cancelled", label: "ยกเลิก", count: statusCounts.cancelled },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    statusFilter === filter.value
                      ? "bg-stone-800 text-white shadow-md"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            {...pageMotion}
            className="text-center py-20 bg-white/80 rounded-3xl border border-dashed border-stone-200 shadow-inner"
          >
            <p className="text-stone-500">
              {searchQuery || statusFilter !== "all"
                ? "ไม่พบออเดอร์ที่ค้นหา"
                : "ยังไม่มีออเดอร์"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order, index) => {
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
                  {/* Header */}
                  <div className="relative bg-gradient-to-br from-stone-800 via-stone-700 to-stone-800 px-4 md:px-6 pt-3 pb-5">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-300 font-semibold">
                          หมายเลขคำสั่งซื้อ
                        </p>
                        <div className="inline-block">
                          <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-xl px-5 py-2 shadow-md border-2 border-amber-200/60">
                            <p className="text-xl md:text-2xl font-black text-stone-800 tracking-wider">
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
                        {/* ปุ่มเปลี่ยนสถานะ */}
                        {statusInfo.nextStatus && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, statusInfo.nextStatus!)
                            }
                            disabled={updatingStatus === order.id}
                            className="mt-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {updatingStatus === order.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                กำลังอัปเดต...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                {statusInfo.nextLabel}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8">
                    <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                      {/* รายการสินค้าและสรุปราคา */}
                      <div className="space-y-6">
                        {/* รายการสินค้า */}
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
                                className="flex justify-between gap-4 text-sm bg-white rounded-xl p-4 border-2 border-blue-100/50 shadow-sm"
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

                        {/* สรุปค่าใช้จ่าย */}
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
                                ราคาที่ลูกค้าชำระ
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
                        {/* ข้อมูลการจัดส่ง */}
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
                            {order.profiles?.email && (
                              <div className="text-xs text-stone-500 bg-white/50 rounded-lg p-2 border border-purple-100">
                                อีเมล: {order.profiles.email}
                              </div>
                            )}
                            <p className="text-stone-700 leading-relaxed bg-white border-2 border-purple-100 rounded-xl p-4 font-medium">
                              {order.address}
                            </p>
                            {order.note && (
                              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                                <p className="text-xs text-amber-800 font-semibold mb-1">
                                  หมายเหตุ:
                                </p>
                                <p className="text-xs text-amber-700">{order.note}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* สลิปการชำระเงิน */}
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
                              <span className="font-medium">ไม่มีสลิปแนบมาด้วย</span>
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
        )}
      </div>
    </motion.section>
  );
}
