import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "clear_user_cart") {
      if (!body.user_id) {
        return NextResponse.json({ error: "missing user_id" }, { status: 400 });
      }
      // ลบข้อมูลจากตะกร้า
      const { error } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq("user_id", body.user_id);
      // ลบข้อมูลไม่สำเร็จ ไม่ต้องยกเลิกการทำงานอื่น
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
