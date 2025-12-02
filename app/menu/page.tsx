"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProductCard } from "@/components/ProductCard";
import CustomCakeModal from "@/components/CustomCakeModal";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import type { Product, CustomCakePayload } from "@/types";
import { useAlert } from "@/components/AlertProvider";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  CakeSlice,
  Candy,
  Cookie,
  Croissant,
  IceCream,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "ทั้งหมด", icon: Sparkles },
  { id: "cake", label: "เค้ก", icon: CakeSlice },
  { id: "cookie", label: "คุกกี้", icon: Cookie },
  { id: "tart", label: "ทาร์ต", icon: Croissant },
  { id: "cupcake", label: "คัพเค้ก", icon: IceCream },
  { id: "macaron", label: "มาการอง", icon: Candy },
  { id: "other", label: "เมนูพิเศษ", icon: Sparkles },
];

export default function MenuPage() {
  const { showAlert } = useAlert();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [openCustom, setOpenCustom] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();
  const [isAdding, setIsAdding] = useState(false);

  // ✅ 2. เพิ่ม State สำหรับเก็บหมวดหมู่ที่เลือก (ค่าเริ่มต้นคือ 'all')
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Get search query from URL
    const search = searchParams.get("search");
    if (search) {
      queueMicrotask(() => setSearchQuery(search));
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);

      if (mounted) {
        setProducts(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ 3. ฟังก์ชันกรองสินค้า (รวมการค้นหา)
  const filteredProducts = products.filter((product) => {
    // Filter by category
    if (selectedCategory !== "all" && product.category !== selectedCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const openForCustom = (product: Product) => {
    setSelected(product);
    setOpenCustom(true);
  };

  const handleAddCustom = async (payload: CustomCakePayload) => {
    if (!user)
      return showAlert(
        "เข้าสู่ระบบไม่สำเร็จ",
        "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า",
        "error"
      );
    setIsAdding(true);
    const { error } = await supabase.from("cart_items").insert([
      {
        user_id: user.id,
        product_id: payload.productId,
        product_name: payload.name,
        price: payload.price,
        quantity: payload.qty ?? 1,
        custom_options: payload.custom_options ?? {},
      },
    ]);
    setIsAdding(false);
    if (error) {
      console.error(error);
      showAlert(
        "เพิ่มสินค้าไม่สำเร็จ",
        "เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า",
        "error"
      ); 
    } else {
      setOpenCustom(false);
      showAlert(
        "เพิ่มสินค้าสำเร็จ",
        "เพิ่มสินค้าลงในตะกร้าเรียบร้อยแล้ว",
        "success"
      ); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-600">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
          <p>กำลังโหลดเมนู...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-10 min-h-screen"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-stone-800 mb-2">
          สินค้าทั้งหมด
        </h1>
        {searchQuery ? (
          <p className="text-stone-600 text-lg">
            ผลการค้นหา: <span className="font-bold text-stone-900">&ldquo;{searchQuery}&rdquo;</span>
            {filteredProducts.length > 0 && (
              <span className="text-stone-500"> ({filteredProducts.length} รายการ)</span>
            )}
          </p>
        ) : (
          <p className="text-stone-500 text-lg">
            เลือกความอร่อยที่คุณชื่นชอบได้เลย
          </p>
        )}
      </div>

      {/* ✅ 4. แถบเลือกหมวดหมู่ (Scroll แนวนอนได้ในมือถือ) */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 overflow-x-auto pb-2 px-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm border
              ${
                selectedCategory === cat.id
                  ? "bg-stone-900 text-white scale-105 shadow-md border-stone-900" // สถานะที่เลือกอยู่
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300" // สถานะปกติ
              }
            `}
          >
            <span className="inline-flex items-center gap-2">
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* ✅ 5. แสดงสินค้า (ใช้ filteredProducts แทน products เดิม) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onOpenCustom={openForCustom} />
          ))}
        </div>
      ) : (
        // ถ้าไม่มีสินค้าในหมวดนี้
        <div className="text-center py-20">
          <p className="text-xl text-stone-400">ไม่มีสินค้าในหมวดหมู่นี้</p>
          <button
            onClick={() => setSelectedCategory("all")}
            className="mt-4 text-stone-600 underline hover:text-stone-800"
          >
            ดูสินค้าทั้งหมด
          </button>
        </div>
      )}

      <CustomCakeModal
        open={openCustom}
        onClose={() => setOpenCustom(false)}
        product={selected}
        onAddCustom={handleAddCustom}
        isAdding={isAdding}
      />
    </motion.div>
  );
}
