/**
 * หน้าสั่งซื้อสินค้า
 * กรอกข้อมูลจัดส่ง, อัปโหลดสลิป, ใช้โค้ดส่วนลด, และสร้างคำสั่งซื้อ
 */

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/useSupabaseAuth";
import { useAlert } from "@/components/AlertProvider";
import { motion } from "framer-motion";
import { CreditCard, MapPin, Navigation, ShoppingBag } from "lucide-react";

// ========== Types ==========

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  custom_options: {
    flavor?: string;
    frosting?: string;
    note?: string;
    toppings?: string;
  } | null;
}

// ========== Constants ==========

const BANK_INFO = {
  bankName: "ธนาคารกสิกรไทย (KBANK)",
  accountName: "ร้านบ้านขนม (Baan Kanom)",
  accountNumber: "123-4-56789-0",
};

// ========== Main Component ==========

export default function CheckoutPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  // State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [distance, setDistance] = useState<number | "">("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // ดึงข้อมูลสินค้าในตะกร้า
  useEffect(() => {
    if (!user) return;
    async function fetchCart() {
      const { data } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user!.id);

      if (data) {
        setCartItems(data as CartItem[]);
        const total = data.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        setSubTotal(total);
      }
      setLoading(false);
    }
    fetchCart();
  }, [user]);

  // คำนวณค่าจัดส่ง: 30 บาท + (ระยะทาง x 5 บาท) หรือฟรีถ้าใช้โค้ด FREEDEL
  const calculateShipping = (km: number) => {
    if (km <= 0) return 0;
    if (appliedCode === "FREEDEL" && subTotal >= 500) return 0; // ถ้าใช้โค้ดส่งฟรี และยอดถึง

    // ตัวอย่างสูตร: เริ่มต้น 30 บาท + กม. ละ 5 บาท
    const basePrice = 30;
    const perKm = 5;

    return basePrice + km * perKm;
  };

  const shippingCost = calculateShipping(Number(distance));
  const finalPrice = Math.max(0, subTotal - discount + shippingCost);

  // ตรวจสอบเงื่อนไขโค้ดส่วนลด (ยกเลิกอัตโนมัติถ้ายอดไม่ถึง)
  useEffect(() => {
    // เช็คเงื่อนไขคูปองเมื่อยอดเปลี่ยน
    if (appliedCode === "FREEDEL" && subTotal < 500) {
      setDiscount(0);
      setCouponMessage({
        text: `ยอดไม่ถึง 500 บาท โปรส่งฟรีถูกยกเลิก`,
        type: "error",
      });
    } else if (appliedCode === "WELCOME50" && subTotal < 300) {
      setDiscount(0);
      setCouponMessage({
        text: `ยอดไม่ถึง 300 บาท ส่วนลดถูกยกเลิก`,
        type: "error",
      });
    }
  }, [subTotal, appliedCode]);

  // ใช้โค้ดส่วนลด (HBD10: ลด 10%, FREEDEL: ส่งฟรี, WELCOME50: ลด 50 บาท)
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: "กรุณากรอกโค้ด", type: "error" });
      return;
    }

    if (code === "HBD10") {
      const discountValue = subTotal * 0.1;
      setDiscount(discountValue);
      setAppliedCode(code);
      setCouponMessage({
        text: `ใช้โค้ด ${code} สำเร็จ! ลด 10%`,
        type: "success",
      });
    } else if (code === "FREEDEL") {
      if (subTotal < 500) {
        setDiscount(0);
        setCouponMessage({
          text: `ต้องมียอดขั้นต่ำ 500.- (ขาด ${500 - subTotal}.-)`,
          type: "error",
        });
      } else {
        setAppliedCode(code);
        setCouponMessage({ text: "ใช้โค้ดส่งฟรีสำเร็จ!", type: "success" });
      }
    } else if (code === "WELCOME50") {
      if (subTotal < 300) {
        setDiscount(0);
        setCouponMessage({
          text: `ต้องมียอดขั้นต่ำ 300.- (ขาด ${300 - subTotal}.-)`,
          type: "error",
        });
      } else {
        setDiscount(50);
        setAppliedCode(code);
        setCouponMessage({
          text: `ใช้โค้ด ${code} ลด 50 บาท เรียบร้อย!`,
          type: "success",
        });
      }
    } else {
      setDiscount(0);
      setCouponMessage({ text: "ไม่พบโค้ดส่วนลดนี้", type: "error" });
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCode("");
    setCouponCode("");
    setCouponMessage(null);
  };

  // อัปโหลดสลิปไปยัง Supabase Storage และคืนค่า URL
  const uploadSlip = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from("slips")
      .upload(filePath, file);
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
      .from("slips")
      .getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  // ส่งคำสั่งซื้อ: อัปโหลดสลิป, สร้าง order, เพิ่ม order_items, ลบตะกร้า
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (cartItems.length === 0)
      return showAlert(
        "ตะกร้าว่างเปล่า",
        "กรุณาเลือกสินค้าก่อนสั่งซื้อครับ",
        "error"
      );
    if (!slip)
      return showAlert(
        "ยังไม่ได้แนบสลิป",
        "กรุณาโอนเงินและแนบสลิปก่อนนะครับ",
        "error"
      );

    setSubmitting(true);
    try {
      const slipUrl = await uploadSlip(slip!);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user?.id,
            total_price: finalPrice,
            status: "pending",
            name,
            address,
            phone,
            note: note || null,
            slip_url: slipUrl,
            discount_amount: discount,
            promotion_code: appliedCode || null,
            shipping_cost: shippingCost, // ✅ บันทึกค่าส่ง
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        custom_options: item.custom_options,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;

      await supabase.from("cart_items").delete().eq("user_id", user?.id);

      showAlert(
        "สั่งซื้อสำเร็จ! ",
        "ขอบคุณที่อุดหนุนค่ะ สามารถติดตามสถานะและรายละเอียดคำสั่งซื้อได้ที่หน้าประวัติคำสั่งซื้อ",
        "success",
        () => router.push("/orders")
      );
    } catch (error) {
      console.error(error);
      showAlert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกคำสั่งซื้อได้", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ตรวจสอบความถูกต้องของฟอร์ม
  const isFormValid =
    name.trim() !== "" &&
    phone.trim() !== "" &&
    address.trim() !== "" &&
    distance !== "" &&
    Number(distance) > 0 &&
    slip !== null &&
    cartItems.length > 0 &&
    couponMessage?.type !== "error";

  if (loading)
    return <div className="p-10 text-center text-stone-500">กำลังโหลด...</div>;
  if (cartItems.length === 0)
    return (
      <div className="p-10 text-center text-stone-500">ไม่มีสินค้าในตะกร้า</div>
    );

  // ========== Main Render ==========

  return (
    <motion.div
      className="min-h-screen bg-[#fbf4eb] py-10 px-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100">
            <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-stone-500" />
              ที่อยู่จัดส่ง
            </h2>
            <form
              id="checkout-form"
              onSubmit={handlePlaceOrder}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  ชื่อผู้รับ
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="08x-xxx-xxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  ที่อยู่จัดส่ง
                </label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="บ้านเลขที่, ถนน, แขวง/เขต, จังหวัด..."
                />
              </div>

              {/* กรอกระยะทางสำหรับคำนวณค่าจัดส่ง */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  ระยะทางจากร้าน (กม.)
                  <span className="text-stone-400 font-normal text-xs ml-2">
                    (เริ่มต้น 30฿ + 5฿/กม.)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={distance}
                    onChange={(e) =>
                      setDistance(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full p-3 bg-white border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                    placeholder="เช่น 5.5"
                  />
                  <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap px-3 py-3 bg-white border border-stone-300 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-100 transition-colors flex items-center gap-1"
                  >
                    <Navigation className="w-4 h-4" />
                    เช็คระยะทาง
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  หมายเหตุถึงร้านค้า{" "}
                  <span className="text-stone-400 font-normal text-xs">
                    (ไม่บังคับ)
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                  placeholder="เช่น ฝากไว้ที่ป้อมยาม, ขอช้อนส้อม..."
                />
              </div>
            </form>
          </div>

          {/* ข้อมูลการชำระเงิน */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100">
            <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-stone-500" />
              ชำระเงิน
            </h2>
            <div className="bg-stone-800 text-white p-4 rounded-xl mb-4">
              <p className="text-sm opacity-80">โอนเงินเข้าบัญชี</p>
              <p className="text-lg font-bold">{BANK_INFO.bankName}</p>
              <p className="text-2xl font-mono my-1 tracking-wider">
                {BANK_INFO.accountNumber}
              </p>
              <p className="text-sm opacity-80">
                ชื่อบัญชี: {BANK_INFO.accountName}
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-stone-700">
                แนบสลิปโอนเงิน
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setSlip(e.target.files?.[0] || null)}
                className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/*  สรุปคำสั่งซื้อ */}
        <div className="bg-white p-6 rounded-2xl shadow-lg/30 border border-stone-100 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-500" />
            สรุปคำสั่งซื้อ
          </h2>

          <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm border-b border-stone-50 pb-3 last:border-0"
              >
                <div>
                  <span className="font-bold text-stone-700 block">
                    {item.product_name}
                  </span>
                  <span className="text-stone-400 text-xs">
                    x {item.quantity} ชิ้น
                  </span>
                  {item.custom_options && (
                    <div className="text-xs text-stone-500 mt-1 bg-stone-50 p-1 rounded border border-stone-100">
                      {item.custom_options?.flavor && (
                        <div>รส: {item.custom_options.flavor}</div>
                      )}
                      {item.custom_options?.frosting && (
                        <div>หน้า: {item.custom_options.frosting}</div>
                      )}
                      {item.custom_options?.toppings && (
                        <div>ท็อปปิ้ง: {item.custom_options.toppings}</div>
                      )}
                      {item.custom_options?.note && (
                        <div>โน้ต: {item.custom_options.note} </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-stone-600 font-medium">
                  ฿{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* โค้ดส่วนลด */}
          <div className="mb-6">
            <label className="text-sm font-bold text-stone-700 block mb-2">
              โค้ดส่วนลด
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!appliedCode}
                placeholder="กรอกโค้ดที่นี่"
                className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 uppercase placeholder-stone-300"
              />
              {appliedCode ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200"
                >
                  ยกเลิก
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-stone-200 text-stone-700 text-sm font-bold rounded-lg hover:bg-stone-400 transition-colors"
                >
                  ใช้โค้ด
                </button>
              )}
            </div>

            {/* ข้อความแจ้งเตือนคูปอง */}
            {couponMessage && (
              <p
                className={`text-xs mt-2 font-medium ${
                  couponMessage.type === "error"
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {couponMessage.text}
              </p>
            )}
          </div>

          {/* สรุปราคา */}
          <div className="border-t-2 border-stone-100 pt-4 space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>ยอดรวมสินค้า</span>
              <span>฿{subTotal.toFixed(2)}</span>
            </div>

            {/* แสดงส่วนลดถ้ามี */}
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>ส่วนลด ({appliedCode})</span>
                <span>-฿{discount.toFixed(2)}</span>
              </div>
            )}

            {/* แสดงค่าจัดส่ง */}
            <div className="flex justify-between text-stone-600">
              <span>ค่าจัดส่ง ({distance ? `${distance} กม.` : "กม."})</span>
              <span>
                {shippingCost > 0 ? (
                  `฿${shippingCost.toFixed(2)}`
                ) : appliedCode === "FREEDEL" && subTotal >= 500 ? (
                  <span className="text-green-600 font-bold">ฟรี</span>
                ) : (
                  "฿0.00"
                )}
              </span>
            </div>

            <div className="flex justify-between text-xl font-bold text-stone-800 pt-2 border-t border-stone-100 mt-2">
              <span>ยอดสุทธิ</span>
              <span>฿{finalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={!isFormValid || submitting}
            className={`
              w-full mt-6 py-3 font-bold rounded-xl shadow-lg transition-all flex justify-center
              ${
                !isFormValid || submitting
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed" // สีเทา
                  : "bg-stone-800 text-white hover:bg-stone-900 hover:shadow-xl transform active:scale-95 cursor-pointer" // สีเข้ม
              }
            `}
          >
            {submitting ? (
              <div className="w-6 h-6 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "ยืนยันการสั่งซื้อ"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
