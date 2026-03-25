"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/AlertProvider";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Calendar,
  User,
  AlertCircle
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
  color: string;
};

// ========== Constants ==========

const STATUS_BADGES: Record<string, StatusMeta> = {
  pending: {
    label: "รอตรวจสอบ",
    className: "bg-amber-50 text-amber-600 border-amber-100",
    icon: Clock3,
    description: "รอยืนยันการชำระเงินจากสลิป",
    nextStatus: "confirmed",
    nextLabel: "ยืนยันชำระเงิน",
    color: "#D97706"
  },
  confirmed: {
    label: "กำลังเตรียมหนม",
    className: "bg-blue-50 text-blue-600 border-blue-100",
    icon: ReceiptText,
    description: "เตรียมวัตถุดิบและเริ่มอบความอร่อย",
    nextStatus: "delivering",
    nextLabel: "ส่งของเลย!",
    color: "#2563EB"
  },
  delivering: {
    label: "กำลังไปส่งค่ะ",
    className: "bg-bakery-pink/10 text-bakery-pink border-bakery-pink/20",
    icon: Truck,
    description: "ขนมกำลังเดินทางไปหาลูกค้าแล้วค่ะ",
    nextStatus: "completed",
    nextLabel: "ส่งสำเร็จแล้ว",
    color: "#FF8DA1"
  },
  completed: {
    label: "อิ่มอร่อยแล้ว",
    className: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: CheckCircle2,
    description: "ลูกค้าได้รับขนมเรียบร้อย",
    color: "#059669"
  },
  cancelled: {
    label: "ยกเลิกแล้ว",
    className: "bg-stone-50 text-stone-500 border-stone-100",
    icon: XCircle,
    description: "คำสั่งซื้อนี้ถูกยกเลิกแล้ว",
    color: "#78716C"
  },
};

const pageMotion = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: "easeOut" as const },
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

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map((o: Order) => o.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));
        const ordersWithProfiles = ordersData.map((order) => ({
          ...order,
          profiles: profilesMap.get(order.user_id) || null,
        }));
        setOrders(ordersWithProfiles as Order[]);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      showAlert("Error", "ไม่สามารถดึงข้อมูลออเดอร์ได้ค่ะ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    async function checkAdmin() {
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!data || data.role !== "admin") {
        showAlert("Access Denied", "เฉพาะผู้ดูแลระบบเท่านั้นค่ะ", "error", () => router.replace("/"));
        return;
      }
      setIsAdmin(true);
      fetchOrders();
    }
    checkAdmin();
  }, [user, authLoading]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      showAlert("สำเร็จ", "อัปเดตสถานะเรียบร้อยแล้วค่ะ", "success");
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert("Error", "ไม่สามารถอัปเดตสถานะได้ค่ะ", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

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
      <div className="min-h-screen bg-bakery-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-100 border-t-bakery-pink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bakery-cream py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black tracking-[0.3em] text-bakery-pink uppercase bg-white px-4 py-1.5 rounded-full border border-pink-100 shadow-sm">
              Admin Dashboard
            </span>
            <h1 className="text-5xl font-black text-bakery-black tracking-tight flex items-center gap-4">
              <Package className="w-12 h-12 text-bakery-black" />
              จัดการออเดอร์
            </h1>
            <p className="text-stone-500 font-medium text-lg">
              ตรวจสอบการชำระเงินและอัปเดตสถานะขนมที่นี่ค่ะ
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-pink-900/5 border border-pink-50 flex items-center gap-6">
              <div className="text-center px-4 border-r border-pink-50">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-2xl font-black text-bakery-black">{statusCounts.all}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] font-black text-bakery-pink uppercase tracking-widest mb-1">New</p>
                <p className="text-2xl font-black text-bakery-pink">{statusCounts.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="sticky top-6 z-20 bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl shadow-pink-900/10 border border-pink-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขออเดอร์ ชื่อ หรือเบอร์โทร..."
              className="w-full pl-14 pr-6 py-4 bg-bakery-cream/50 border border-pink-50 rounded-[2rem] focus:ring-2 focus:ring-bakery-pink transition-all outline-none font-bold text-bakery-black"
            />
          </div>
          <div className="flex gap-2 p-1 bg-bakery-cream/50 rounded-[2rem] overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'all', label: 'ทั้งหมด', icon: Package },
              { id: 'pending', label: 'รอตรวจ', icon: Clock3 },
              { id: 'confirmed', label: 'เตรียมของ', icon: ReceiptText },
              { id: 'delivering', label: 'ส่งของ', icon: Truck },
              { id: 'completed', label: 'สำเร็จ', icon: CheckCircle2 },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-black transition-all shrink-0 ${
                  statusFilter === f.id
                    ? "bg-bakery-black text-white shadow-lg"
                    : "text-stone-500 hover:bg-white"
                }`}
              >
                <f.icon className="w-4 h-4" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order Grid */}
        <div className="grid gap-8">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => {
              const info = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-[3rem] shadow-2xl shadow-pink-900/5 border border-pink-50 overflow-hidden group hover:shadow-pink-900/10 transition-shadow"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Panel: Customer & Meta */}
                    <div className="lg:col-span-4 p-10 bg-bakery-cream/30 border-b lg:border-b-0 lg:border-r border-pink-50 space-y-8">
                      <div className="space-y-4">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${info.className}`}>
                          <info.icon className="w-4 h-4" />
                          <span className="text-xs font-black uppercase tracking-widest">{info.label}</span>
                        </div>
                        <h3 className="text-3xl font-black text-bakery-black leading-tight">
                          {order.name}
                        </h3>
                        <div className="flex items-center gap-3 text-stone-500 font-bold">
                          <Phone className="w-4 h-4 text-bakery-pink" />
                          {order.phone}
                        </div>
                        {order.profiles?.email && (
                          <div className="flex items-center gap-3 text-stone-400 text-sm font-medium">
                            <User className="w-4 h-4" />
                            {order.profiles.email}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-bakery-pink shrink-0 mt-1" />
                          <p className="text-sm font-medium text-stone-600 leading-relaxed italic">
                            {order.address}
                          </p>
                        </div>
                        {order.note && (
                          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-xs font-bold text-amber-700 italic">"{order.note}"</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-pink-50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Order Date</p>
                          <div className="flex items-center gap-2 text-stone-600 font-black">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString('th-TH', { 
                              day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total</p>
                          <p className="text-2xl font-black text-bakery-black">฿{order.total_price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Middle Panel: Items */}
                    <div className="lg:col-span-5 p-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black text-bakery-black flex items-center gap-2">
                          <ReceiptText className="w-6 h-6 text-bakery-pink" />
                          รายการสั่งซื้อ
                        </h4>
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-bakery-black">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="p-4 bg-bakery-cream/20 rounded-2xl border border-pink-50 hover:bg-white hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-black text-bakery-black">{item.product_name}</p>
                                <p className="text-xs font-bold text-stone-400">Qty: {item.quantity} · ฿{item.price.toLocaleString()}</p>
                              </div>
                              <p className="font-black text-bakery-black">฿{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                            {item.custom_options && (
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-pink-50 mt-2">
                                {Object.entries(item.custom_options).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-white border border-pink-100 px-2 py-1 rounded-md text-stone-500 font-bold">
                                    {k}: {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-pink-50 space-y-2">
                         <div className="flex justify-between text-sm font-bold text-stone-400">
                           <span>ค่าส่ง</span>
                           <span>฿{(order.shipping_cost || 0).toLocaleString()}</span>
                         </div>
                         {order.discount_amount && (
                           <div className="flex justify-between text-sm font-black text-bakery-pink">
                             <span>ส่วนลด {order.promotion_code && `(${order.promotion_code})`}</span>
                             <span>-฿{order.discount_amount.toLocaleString()}</span>
                           </div>
                         )}
                      </div>
                    </div>

                    {/* Right Panel: Proof & Actions */}
                    <div className="lg:col-span-3 p-10 bg-stone-50/50 flex flex-col justify-between gap-8">
                       <div>
                        <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">หลักฐานการโอน</h4>
                        {order.slip_url ? (
                          <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl shadow-stone-900/20 group/slip border-4 border-white">
                            <Image 
                              src={order.slip_url} 
                              alt="Payment Slip" 
                              fill 
                              className="object-cover transition-transform duration-700 group-hover/slip:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/slip:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                              <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-4">Payment Verification</p>
                              <a 
                                href={order.slip_url} 
                                target="_blank" 
                                className="w-full py-3 bg-white text-bakery-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-bakery-pink hover:text-white transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                ขยายรูปสลิป
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[3/4] rounded-[2rem] border-4 border-dashed border-stone-200 flex flex-col items-center justify-center p-10 text-center space-y-4">
                            <ImageOff className="w-10 h-10 text-stone-300" />
                            <p className="text-xs font-black text-stone-400 uppercase leading-relaxed tracking-widest">No payment slip attached</p>
                          </div>
                        )}
                       </div>

                       <div className="space-y-3 text-bakery-black">
                         {info.nextStatus && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, info.nextStatus!)}
                              disabled={updatingStatus === order.id}
                              className="w-full py-5 bg-bakery-black text-white rounded-[1.5rem] font-black shadow-xl shadow-black/10 hover:bg-stone-800 hover:scale-[1.03] active:scale-95 transition-all disabled:bg-stone-300 flex items-center justify-center gap-3 group"
                            >
                              {updatingStatus === order.id ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  {info.nextLabel}
                                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </button>
                         )}
                         <div className="dropdown relative group w-full">
                            <button className="w-full py-4 bg-white border border-stone-200 text-stone-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors">
                              Update Status
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-3xl shadow-2xl border border-pink-50 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-30">
                              {Object.entries(STATUS_BADGES).map(([key, s]) => (
                                <button
                                  key={key}
                                  onClick={() => handleUpdateStatus(order.id, key)}
                                  disabled={order.status === key}
                                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-bakery-cream transition-colors text-left disabled:opacity-30"
                                >
                                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                  <span className="text-xs font-black text-stone-600 uppercase tracking-widest">{s.label}</span>
                                </button>
                              ))}
                            </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-40 bg-white rounded-[4rem] border border-pink-50 shadow-inner">
            <div className="w-24 h-24 bg-bakery-cream rounded-full flex items-center justify-center mx-auto mb-8">
              <Package className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-2xl font-black text-bakery-black mb-2">ไม่พบออเดอร์ค่ะ</h3>
            <p className="text-stone-400 font-medium">ลองเปลี่ยนตัวกรองหรือคำค้นดูนะคะ</p>
          </div>
        )}

      </div>
    </div>
  );
}
