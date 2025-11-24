"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product, ProductInsert } from "@/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useAlert } from "@/components/AlertProvider";

// หมวดหมู่สินค้า (ต้องตรงกับหน้า Menu)
const CATEGORIES = [
  { id: "cake", label: "เค้ก" },
  { id: "cookie", label: "คุกกี้" },
  { id: "tart", label: "ทาร์ต" },
  { id: "cupcake", label: "คัพเค้ก" },
  { id: "macaron", label: "มาการอง" },
  { id: "other", label: "อื่นๆ" },
];

export default function AdminPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user, isLoading } = useSupabaseAuth();

  // --- State ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>(""); // keep as string for controlled input
  const [category, setCategory] = useState("cake");
  const [isCustom, setIsCustom] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // --- Helpers for storage upload/delete ---
  type UploadResult = { publicUrl: string; path: string };

  const uploadImage = async (file: File): Promise<UploadResult> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `cakes/${fileName}`;

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, { upsert: false }); // don't overwrite

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);

    return { publicUrl: publicUrlData.publicUrl, path: data.path };
  };

  const deleteImage = async (imageOrPath: string) => {
    try {
      let path = imageOrPath;

      // If looks like a URL, try to extract path after '/product-images/'
      if (imageOrPath.startsWith("http")) {
        const marker = "/product-images/";
        const idx = imageOrPath.indexOf(marker);
        if (idx === -1) {
          // fallback: try to extract the last two segments
          const parts = imageOrPath.split("/").filter(Boolean);
          path = parts.slice(-2).join("/");
        } else {
          path = imageOrPath.substring(idx + marker.length);
        }
      }

      // remove expects an array of paths
      await supabase.storage.from("product-images").remove([path]);
    } catch (err) {
      // Log but don't throw — deletion failure shouldn't block other flows
      console.error("deleteImage error:", err);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setIsCustom(false);
    setImage(null);
    setCategory("cake");
    setEditingProduct(null);
    setLoading(false);
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price ?? ""));
    setCategory(product.category || "cake");
    setIsCustom(product.is_custom || false);
    setImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // --- 1. ตรวจสอบสิทธิ์ Admin ---
  useEffect(() => {
    let mounted = true;

    if (isLoading) return;

    const checkAdmin = async () => {
      // user = null → ยังไม่ล็อกอิน
      if (user === null) {
        router.replace("/login");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log("user.id:", user.id);
        console.log("role:", data?.role);

        // ถ้าหาไม่เจอ หรือไม่ใช่ admin → ห้ามเข้า
        if (error || !data || data.role !== "admin") {
          if (error || data?.role !== "admin") {
            showAlert(
              "เข้าไม่ได้",
              "คุณไม่มีสิทธิ์เข้าถึงหน้านี้!",
              "error",
              () => router.replace("/")
            );
          }
          return;
        }

        // ผ่าน!
        if (mounted) {
          setIsAdmin(true);
          fetchProducts();
        }
      } catch (err) {
        console.error("checkAdmin error:", err);
        router.replace("/");
      } finally {
        if (mounted) setCheckingRole(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [user, router, isLoading, showAlert]);

  // --- fetchProducts with mounted guard ---
  async function fetchProducts() {
    setLoadingProducts(true);
    let isMounted = true;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        if (isMounted) setProducts(data || []);
      }
    } catch (err) {
      console.error("fetchProducts thrown:", err);
    } finally {
      if (isMounted) setLoadingProducts(false);
    }

    // cleanup function to prevent state updates if unmounted quickly
    return () => {
      isMounted = false;
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price)
      return showAlert("กรอกข้อมูลไม่ครบ", "กรุณาใส่ชื่อและราคาสินค้า", "info");

    setLoading(true);
    let uploadedNewImagePath: string | null = null;
    let uploadedNewPublicUrl: string | null = null;

    try {
      let imageUrl = editingProduct?.image_url || null;

      // If user selected a new image, upload it
      if (image) {
        const uploadResult = await uploadImage(image);
        uploadedNewImagePath = uploadResult.path;
        uploadedNewPublicUrl = uploadResult.publicUrl;
        imageUrl = uploadedNewPublicUrl;
      }

      // Prepare product data
      const productData: ProductInsert = {
        name,
        price: Number(price),
        image_url: imageUrl,
        description: description || null,
        category,
        is_custom: isCustom,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        if (image && editingProduct.image_url) {
          await deleteImage(editingProduct.image_url);
        }
      } else {
        const { error } = await supabase.from("products").insert([productData]);
        if (error) throw error;
        showAlert(
          "เพิ่มสำเร็จ! ✨",
          `เพิ่มสินค้า ${name} เข้าสู่เมนูเรียบร้อยแล้ว`,
          "success"
        ); // ✅ แทนที่ alert
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");

      // If we uploaded a new image but DB update failed, remove uploaded image to avoid orphan
      if (uploadedNewImagePath) {
        try {
          await deleteImage(uploadedNewImagePath);
        } catch (delErr) {
          console.error(
            "Failed to delete newly uploaded image after DB failure:",
            delErr
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`ยืนยันลบสินค้า "${product.name}"?`)) return;
    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (dbError) throw dbError;

      if (product.image_url) await deleteImage(product.image_url);

      showAlert("ลบสำเร็จ", `สินค้า "${product.name}" ถูกลบออกจากระบบแล้ว`, "success");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (editingProduct?.id === product.id) resetForm();
    } catch (err) {
      console.error(err);
      showAlert("ลบไม่สำเร็จ", "เกิดข้อผิดพลาดขณะลบสินค้า", "error");
    } finally {
      setLoading(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
          <p>กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FBF9F6] py-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- ส่วนที่ 1: ฟอร์มจัดการสินค้า --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              {editingProduct ? "✏️ แก้ไขสินค้า" : "➕ เพิ่มสินค้าใหม่"}
            </h1>

            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  ชื่อสินค้า
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    ราคา
                  </label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={price}
                    onChange={(e) => {
                      // allow only numbers and empty
                      const val = e.target.value;
                      if (val === "" || /^[0-9]*$/.test(val)) setPrice(val);
                    }}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all"
                    required
                    min="0"
                  />
                </div>
                {/* ✅ เพิ่ม Dropdown หมวดหมู่ */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  รูปภาพ
                </label>
                <label className="w-full flex items-center justify-center px-4 py-8 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                  <div className="text-center">
                    <span className="text-3xl block mb-2">📷</span>
                    <span className="text-sm text-stone-500 truncate max-w-[200px] block">
                      {image ? image.name : "คลิกเพื่อเลือกรูปภาพ"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>

                {/* show existing image preview when editing and no new image selected */}
                {editingProduct?.image_url && !image && (
                  <div className="mt-3 text-sm text-stone-500">
                    รูปปัจจุบัน: {editingProduct.image_url.split("/").pop()}
                  </div>
                )}
              </div>

              <div className="flex items-center p-3 bg-stone-50 rounded-xl">
                <input
                  id="isCustom"
                  type="checkbox"
                  checked={isCustom}
                  onChange={(e) => setIsCustom(e.target.checked)}
                  className="w-5 h-5 text-stone-600 border-stone-300 rounded focus:ring-stone-500 accent-stone-700"
                />
                <label
                  htmlFor="isCustom"
                  className="ml-3 block text-sm font-medium text-stone-700 cursor-pointer select-none"
                >
                  เปิดให้ลูกค้าปรับแต่งหน้าเค้กได้ 🎨
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-stone-800 text-white rounded-xl font-bold shadow-md hover:bg-stone-900 transition-all disabled:opacity-50"
                >
                  {loading
                    ? "กำลังบันทึก..."
                    : editingProduct
                    ? "💾 บันทึกการแก้ไข"
                    : "✨ เพิ่มสินค้า"}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full py-3 bg-white border-2 border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* --- ส่วนที่ 2: รายการสินค้า --- */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-stone-800 mb-6">
            📦 สินค้าทั้งหมด ({products.length})
          </h1>
          {loadingProducts ? (
            <div className="text-center py-10 text-stone-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row items-center gap-5 transition-all hover:shadow-md ${
                    editingProduct?.id === product.id
                      ? "ring-2 ring-stone-400 bg-stone-50"
                      : ""
                  }`}
                >
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-stone-200">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-stone-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-stone-800 text-lg">
                      {product.name}
                    </h3>
                    <p className="text-sm text-stone-500 line-clamp-1">
                      {product.description || "-"}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded-md font-bold">
                        ฿{product.price}
                      </span>
                      {/* แสดงหมวดหมู่ */}
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md border border-blue-100">
                        {CATEGORIES.find((c) => c.id === product.category)
                          ?.label || "ทั่วไป"}
                      </span>
                      {product.is_custom && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(product)}
                      disabled={loading}
                      className="px-4 py-2 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 font-medium transition-colors disabled:opacity-50"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={loading}
                      className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
