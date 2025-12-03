/**
 * หน้าหลัก
 * แสดง Hero Section, สินค้าแนะนำ, ข้อมูลเกี่ยวกับร้าน, และ Footer
 */

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProductCard } from "@/components/ProductCard";
import CustomCakeModal from "@/components/CustomCakeModal";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import Link from "next/link";
import Image from "next/image";
import type { Product, CustomCakePayload } from "@/types";
import { useAlert } from "@/components/AlertProvider";
import {
  ArrowRight,
  MapPin,
  Phone,
  Sparkles,
  Award,
  Heart,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

// ========== Main Component ==========

export default function HomePage() {
  const { user } = useSupabaseAuth();
  const { showAlert } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCustom, setOpenCustom] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // ดึงข้อมูลสินค้าแนะนำ 4 รายการล่าสุด
  useEffect(() => {
    async function fetchFeaturedProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) console.error("Error fetching products:", error);
      else setProducts(data || []);
      setLoading(false);
    }
    fetchFeaturedProducts();
  }, []);

  // เปิด Modal ปรับแต่งเค้ก
  const openForCustom = (product: Product) => {
    setSelected(product);
    setOpenCustom(true);
  };

  // เพิ่มเค้กที่ปรับแต่งแล้วลงตะกร้า
  const handleAddCustom = async (payload: CustomCakePayload) => {
    if (!user)
      return showAlert(
        "เข้าสู่ระบบก่อนนะ",
        "กรุณาเข้าสู่ระบบเพื่อปรับแต่งเค้ก",
        "info"
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
        "ระบบไม่สามารถเพิ่มเค้กแบบ Custom ลงตะกร้าได้",
        "error"
      );
    } else {
      setOpenCustom(false);
      // alert("เพิ่มลงตะกร้าเรียบร้อยแล้ว"); // (Optional)
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow pb-12">
        {/* หน้าแรก */}
        <div className="relative w-full min-h-[90vh] flex items-center overflow-hidden">
          {/* ภาพพื้นหลัง */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=2000&auto=format&fit=crop"
              alt="Cookie decoration background"
              fill
              className="object-cover"
              priority
            />
            {/* ปุ่มกรอง */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/85 via-stone-800/75 to-stone-900/60"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 py-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">SINCE 2020</span>
              </motion.div>

              {/* หัวข้อ */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
              >
                FRESHLY BAKED
                <br />
                <span className="text-amber-200">WITH LOVE</span>
              </motion.h1>

              {/* คำอธิบาย */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-stone-100 text-lg md:text-xl leading-relaxed max-w-xl"
              >
                ร้านขนมโฮมเมดที่ใส่ใจทุกขั้นตอนการทำ คัดสรรวัตถุดิบชั้นดี
                เพื่อส่งมอบความอร่อยและความสุขให้คุณในทุกคำ
              </motion.p>

              {/* ปุ่มเริ่มต้น */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 bg-white text-stone-900 font-bold py-4 px-8 rounded-full shadow-xl hover:bg-stone-100 hover:scale-105 transition-all"
                >
                  เริ่มต้นใช้งาน
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold py-4 px-8 rounded-full hover:bg-white/20 transition-all"
                >
                  เรียนรู้เพิ่มเติม
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* สินค้า */}
        <div className="container mx-auto px-4 mt-8">
          <h2 className="text-3xl font-bold text-center text-stone-800 mb-8">
            เมนูยอดฮิต
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {products.length > 0 ? (
                products.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onOpenCustom={openForCustom} // ส่งฟังก์ชันเปิด Modal
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-stone-500">
                  ยังไม่มีสินค้าแนะนำ
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/menu"
              className="inline-block px-8 py-2 border-2 border-stone-600 text-stone-600 text-lg font-semibold rounded-full hover:bg-stone-600 hover:text-white transition-colors duration-300"
            >
              <span className="inline-flex items-center gap-2">
                ดูรายการขนมเพิ่มเติม
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* เกี่ยวกับร้าน */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative w-full min-h-[80vh] flex items-center overflow-hidden mt-16"
        >
          {/* ภาพพื้นหลัง */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=2000&auto=format&fit=crop"
              alt="ร้านขนม Baan Kanom"
              fill
              className="object-cover"
            />
            {/* ปุ่มกรอง */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-800/80 to-stone-900/70"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 md:px-8 lg:px-12 py-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl space-y-6"
            >
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  เกี่ยวกับเรา
                </h2>
                <div className="w-24 h-1 bg-white rounded-full mb-6"></div>
              </div>

              <p className="text-stone-100 text-lg md:text-xl leading-relaxed">
                ร้านขนมโฮมเมดที่ใส่ใจทุกขั้นตอนการทำ
                คัดสรรวัตถุดิบชั้นดีจากแหล่งผลิตที่เชื่อถือได้
                เพื่อส่งมอบความอร่อยและความสุขให้คุณในทุกคำ
              </p>

              <p className="text-stone-200 text-base md:text-lg leading-relaxed">
                เราเริ่มต้นจากความรักในการทำขนม
                และความตั้งใจที่จะสร้างสรรค์ขนมที่มีคุณภาพ
                ใช้เวลาอย่างเต็มที่ในการเลือกสรรวัตถุดิบที่ดีที่สุด
                เพื่อให้ทุกคำที่คุณลิ้มลอง
                เต็มไปด้วยรสชาติที่หอมหวานและความประณีต
              </p>

              {/* จุดเด่นของร้าน */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center text-center p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg"
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 border border-white/30">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-1 text-lg">
                    คุณภาพสูง
                  </h3>
                  <p className="text-sm text-stone-200">วัตถุดิบชั้นดี</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center text-center p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg"
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 border border-white/30">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-1 text-lg">
                    ทำด้วยใจ
                  </h3>
                  <p className="text-sm text-stone-200">ใส่ใจทุกขั้นตอน</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center text-center p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg"
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 border border-white/30">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-1 text-lg">สดใหม่</h3>
                  <p className="text-sm text-stone-200">อบใหม่ทุกวัน</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="pt-4"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-stone-900 font-bold py-3 px-8 rounded-full shadow-xl hover:bg-stone-100 transition-all"
                >
                  ติดต่อเรา
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="bg-stone-800 text-stone-300 py-12 mt-auto">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Column 1: Logo & คำอธิบาย */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4 font-sans tracking-wide">
              Baan Kanom
            </h3>
            <p className="text-sm leading-relaxed">
              ร้านขนมโฮมเมดที่ใส่ใจทุกขั้นตอนการทำ คัดสรรวัตถุดิบชั้นดี
              เพื่อส่งมอบความอร่อยและความสุขให้คุณในทุกคำ
            </p>
          </div>

          {/* Column 2: ลิงก์รวดเร็ว */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">เมนูลัด</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className="hover:text-white transition-colors"
                >
                  สินค้าทั้งหมด
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="hover:text-white transition-colors"
                >
                  ตะกร้าสินค้า
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  ติดตามสถานะคำสั่งซื้อ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: ติดต่อเรา */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="w-4 h-4 text-stone-400" />
                081-234-5678
              </li>
              <li>LINE: @baankanom</li>
              <li>Facebook: Baan Kanom Official</li>
              <li className="flex items-center gap-2 justify-center md:justify-start">
                <MapPin className="w-4 h-4 text-stone-400" />
                123 ถนนสุขุมวิท, กรุงเทพฯ
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-700 mt-10 pt-6 text-center text-xs text-stone-500">
          &copy; {new Date().getFullYear()} Baan Kanom. All rights reserved.
        </div>
      </footer>

      <CustomCakeModal
        open={openCustom}
        onClose={() => setOpenCustom(false)}
        product={selected}
        onAddCustom={handleAddCustom}
        isAdding={isAdding}
      />
    </div>
  );
}
