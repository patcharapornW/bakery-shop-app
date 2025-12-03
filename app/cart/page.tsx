/**
 * หน้าตะกร้าสินค้า
 * แสดงรายการสินค้า, ปรับจำนวน, ลบสินค้า, และสรุปยอดรวม
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/AlertProvider";

// ========== Types ==========

type CartItem = {
  id: string;
  user_id: string;
  product_name: string;
  price: number;
  quantity: number;
  custom_options?: Record<string, unknown> | null;
  created_at: string;
};

const optionKeyMap: Record<string, string> = {
  flavor: "รสชาติ",
  frosting: "ครีม",
  note: "ข้อความ",
};

// แสดง custom_options เป็นรายการ bullet points
const formatCustomOptions = (options: unknown | null) => {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return null;
  }
  const entries = Object.entries(options);
  if (entries.length === 0) {
    return null;
  }
  return (
    <ul className="text-sm mt-2 text-stone-600 list-disc list-inside space-y-1">
      {" "}
      {entries.map(([key, value]) => {
        if (key === "note" && !value) return null;
        return (
          <li key={key}>
            {optionKeyMap[key] || key}:{" "}
            <strong className="text-stone-700">{String(value)}</strong>
          </li>
        );
      })}
    </ul>
  );
};

// ========== Main Component ==========

export default function CartPage() {
  const { user } = useSupabaseAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลสินค้าในตะกร้า
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) console.error(error);
      if (mounted) setItems(data ?? []);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  // เปลี่ยนจำนวนสินค้า (ถ้าเป็น 0 จะลบออกพร้อมยืนยัน)
  const changeQty = async (id: string, qty: number) => {
    // ป้องกันไม่ให้ quantity ติดลบ หรือเกิน 99
    if (qty < 0) qty = 0;
    if (qty > 99) qty = 99;

    if (qty === 0) {
      // ถ้าระบุ 0 ให้ลบออกจากตะกร้า (พร้อมยืนยัน)
      const itemToDelete = items.find((item) => item.id === id);
      const itemName = itemToDelete?.product_name || "สินค้านี้";

      showAlert(
        "ยืนยันการลบสินค้า",
        `คุณต้องการลบ "${itemName}" ออกจากตะกร้าหรือไม่?`,
        {
          type: "error",
          okText: "ลบสินค้า",
          cancelText: "ยกเลิก",
          onOk: async () => {
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
            await supabase.from("cart_items").delete().eq("id", id);
          },
        }
      );
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity: qty } : item
        )
      );
      await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    }
  };

  // คำนวณยอดรวมทั้งหมด
  const totalPrice = useMemo(() => {
    return items.reduce(
      (s, it) => s + Number(it.price) * (it.quantity ?? 0),
      0
    );
  }, [items]);

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-600">กำลังโหลดตะกร้า...</div>
    );
  }
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto my-4 p-8 text-center bg-white shadow-md rounded-lg">
        <h2 className="text-xl text-stone-700 mb-4">
          กรุณาเข้าสู่ระบบเพื่อดูตะกร้าสินค้า
        </h2>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2 bg-stone-700 text-white rounded-md shadow-sm hover:bg-stone-800 transition-colors font-medium"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-4 p-8 text-center bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-stone-700">
          ตะกร้าของคุณว่างเปล่า
        </h2>
        <button
          onClick={() => router.push("/menu")}
          className="px-6 py-2 bg-stone-700 text-white rounded-md shadow-sm hover:bg-stone-800 transition-colors font-medium"
        >
          กลับไปที่เมนู
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf4eb] py-10 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold text-stone-800 mb-4">
            ตะกร้าสินค้า
          </h1>
          {items.map((it) => (
            <div
              key={it.id}
              className="bg-white shadow-md rounded-2xl p-5 flex items-center justify-between border border-stone-100"
            >
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-lg text-stone-800 mb-1">
                  {it.product_name}
                </h3>
                <p className="text-sm text-stone-600">
                  ฿{Number(it.price).toFixed(2)} / ชิ้น
                </p>
                {formatCustomOptions(it.custom_options)}
              </div>
              <div className="flex flex-col items-end gap-3">
                {" "}
                <p className="font-semibold text-xl text-stone-700">
                  ฿{(Number(it.price) * it.quantity).toFixed(2)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQty(it.id, it.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-stone-200 text-stone-700 rounded-md hover:bg-stone-300 active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <div className="text-lg font-medium w-8 text-center text-stone-800">
                    {it.quantity}
                  </div>
                  <button
                    onClick={() => changeQty(it.id, it.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-stone-200 text-stone-700 rounded-md hover:bg-stone-300 active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/*  สรุปยอด */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-2xl p-5 sticky top-24 border border-stone-100">
            <h2 className="text-xl font-bold text-stone-800 mb-4">สรุปยอด</h2>
            <div className="flex justify-between mb-2 text-stone-700">
              <span>ยอดรวม</span>
              <span>฿{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 text-stone-600 text-sm">
              <span>ค่าจัดส่ง</span>
              <span>(คำนวณภายหลัง)</span>
            </div>
            <hr className="my-3 border-stone-200" />
            <div className="flex justify-between font-bold text-xl text-stone-800 mb-4">
              <span>รวมทั้งหมด</span>
              <span>฿{totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full px-4 py-3 bg-stone-800 text-white rounded-xl shadow-lg hover:bg-stone-900 transition-colors font-bold transform active:scale-95" // ✅ ปรับปุ่ม Checkout
            >
              ดำเนินการต่อ ❯
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
