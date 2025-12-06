-- ============================================
-- สร้าง RLS Policies สำหรับ orders table
-- เพื่อให้ admin สามารถอ่านและอัปเดตออเดอร์ทั้งหมดได้
-- ============================================

-- 1. ตรวจสอบว่า function is_admin() มีอยู่แล้วหรือไม่
-- ถ้ายังไม่มี ให้สร้างก่อน
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- 2. เปิด RLS สำหรับตาราง orders (ถ้ายังไม่ได้เปิด)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. ลบ policies เก่าทั้งหมด (ถ้ามี)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- 4. สร้าง Policy ใหม่

-- Policy 1: ผู้ใช้สามารถอ่านออเดอร์ของตัวเองได้
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admin สามารถอ่านออเดอร์ทั้งหมดได้
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  USING (public.is_admin());

-- Policy 3: ผู้ใช้สามารถสร้างออเดอร์ได้
CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin สามารถอัปเดตออเดอร์ทั้งหมดได้ (เปลี่ยนสถานะ)
CREATE POLICY "Admins can update all orders"
  ON orders
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- สร้าง RLS Policies สำหรับ order_items table
-- ============================================

-- 5. เปิด RLS สำหรับตาราง order_items (ถ้ายังไม่ได้เปิด)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 6. ลบ policies เก่าทั้งหมด (ถ้ามี)
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- 7. สร้าง Policy ใหม่สำหรับ order_items

-- Policy 1: ผู้ใช้สามารถอ่าน order_items ของออเดอร์ตัวเองได้
CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy 2: Admin สามารถอ่าน order_items ทั้งหมดได้
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  USING (public.is_admin());

-- Policy 3: ผู้ใช้สามารถสร้าง order_items ได้ (เมื่อสร้างออเดอร์)
CREATE POLICY "Users can create order items"
  ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- หมายเหตุ:
-- 1. Function is_admin() ใช้ SECURITY DEFINER เพื่อให้สามารถอ่าน profiles ได้โดยไม่ถูก RLS บล็อก
-- 2. Policy "Users can view own orders" ต้องมาก่อนเพื่อให้ผู้ใช้สามารถอ่านออเดอร์ของตัวเองได้
-- 3. หลังจากรัน script นี้แล้ว ให้ลอง refresh หน้าเว็บและเข้าหน้า admin อีกครั้ง
-- ============================================

