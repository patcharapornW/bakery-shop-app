"use client";

import Image from "next/image";

const PROMOTIONS = [
  {
    id: 1,
    title: "ซื้อ 3 แถม 1 (คัพเค้ก)",
    description: "เมื่อซื้อคัพเค้กรสใดก็ได้ครบ 3 ชิ้น รับฟรีทันที 1 ชิ้น!",
    code: "CUPCAKE3GET1",
    image:
      "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=800",
    validUntil: "31 ธ.ค. 2025",
  },
  {
    id: 2,
    title: "ส่วนลดวันเกิด 10%",
    description: "รับส่วนลด 10% สำหรับเค้กปอนด์ เพียงแสดงบัตรประชาชน",
    code: "HBD10",
    image:
      "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&q=80&w=800",
    validUntil: "ตลอดทั้งปี",
  },
  {
    id: 3,
    title: "ส่งฟรี! เมื่อสั่งครบ 500.-",
    description:
      "บริการจัดส่งฟรีภายในระยะทาง 10 กม. เมื่อยอดสั่งซื้อครบ 500 บาท",
    code: "FREEDEL",
    image:
      "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=800",
    validUntil: "31 ธ.ค. 2025",
  },
];

export default function PromotionPage() {
  return (
    <div className="min-h-screen bg-[#fbf4eb] py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-bakery-dark mb-3 tracking-wide">
            โปรโมชั่น{" "}
          </h1>

          <p className="text-bakery-brown text-lg">
            ดีลพิเศษที่เราตั้งใจมอบให้คุณ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROMOTIONS.map((promo) => (
            <div
              key={promo.id}
              className="group bg-white rounded-2xl shadow-md border border-bakery-beige overflow-hidden 
                         flex flex-col md:flex-row 
                         transition-all duration-300 ease-in-out transform 
                         hover:scale-[1.02] hover:shadow-lg" // เพิ่ม hover scale และ shadow
            >
              {/* รูปภาพ */}
              <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-bakery-beige">
                {" "}
                <Image
                  src={promo.image}
                  alt={promo.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" // ✅ เพิ่ม group-hover
                />
              </div>

              {/* รายละเอียด */}
              <div className="p-6 flex flex-col justify-center flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-bakery-dark">
                    {promo.title}
                  </h3>
                </div>

                <p className="text-bakery-brown text-sm mb-4 leading-relaxed">
                  {promo.description}
                </p>

                <div className="mt-auto flex items-center justify-between bg-bakery-beige/50 p-3 rounded-xl border-2 border-bakery-beige border-dashed">
                  {" "}
                  <div className="text-xs text-bakery-brown">
                    {" "}
                    CODE:{" "}
                    <span className="text-bakery-dark font-bold text-base ml-1">
                      {promo.code}
                    </span>{" "}
                  </div>
                  <div className="text-[10px] bg-bakery-beige px-2 py-1 rounded text-bakery-dark">
                    {" "}
                    ถึง {promo.validUntil}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
