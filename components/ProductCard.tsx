"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseAuth } from "./useSupabaseAuth";
import type { Product } from "@/types";
import Image from "next/image";
import { useAlert } from "./AlertProvider";
import { motion } from "framer-motion";
import { Palette, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onOpenCustom?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenCustom,
}) => {
  const { user } = useSupabaseAuth();
  const { showAlert } = useAlert();
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user)
      return showAlert(
        "เข้าสู่ระบบไม่สำเร็จ",
        "กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า",
        "error"
      );
    if (isAdding || !product || product.is_custom) {
      return;
    }
    setIsAdding(true);
    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .is("custom_options", null)
        .limit(1)
        .maybeSingle<{ id: string; quantity: number }>();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: (existing.quantity ?? 1) + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert([
          {
            user_id: user.id,
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity: 1,
            custom_options: null,
          },
        ]);
      }
      showAlert("เพิ่มสำเร็จ", `เพิ่ม ${product.name} ลงในตะกร้าแล้ว`, "success");
    } catch (err) {
      console.error(err);
      showAlert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้",
        "error"
      );
    }
    setIsAdding(false);
  };

  const handleAction = (e: React.MouseEvent) => {
    if (product.is_custom && onOpenCustom) {
      onOpenCustom(product);
    } else {
      addToCart(e);
    }
  };

  return (
    <motion.article
      className="group relative bg-white rounded-3xl border border-stone-100 shadow-lg shadow-stone-200/50 overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative w-full h-56 bg-gradient-to-br from-stone-200 via-stone-100 to-white flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-xl font-bold text-stone-700 opacity-90 px-4 text-center">
            {product.name}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-stone-900 leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-stone-500 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-stone-900">
            ฿{Number(product.price).toFixed(0)}
          </p>
          <button
            onClick={handleAction}
            disabled={isAdding}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              product.is_custom
                ? "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                : "bg-stone-900 text-white hover:bg-stone-800"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={product.is_custom ? "ปรับแต่งสินค้า" : "เพิ่มลงตะกร้า"}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : product.is_custom ? (
              <Palette className="w-5 h-5" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
};
