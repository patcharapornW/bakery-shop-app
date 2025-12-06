-- ============================================
-- แก้ไข RLS Policies สำหรับ profiles table
-- ใช้ SECURITY DEFINER function เพื่อหลีกเลี่ยง recursive query
-- ============================================

-- 1. สร้าง Function สำหรับตรวจสอบ admin (ใช้ SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- ใช้ SECURITY DEFINER เพื่อให้สามารถอ่าน profiles ได้โดยไม่ถูก RLS บล็อก
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ลบ policies เก่าทั้งหมด
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 3. สร้าง Policy ใหม่

-- Policy 1: ผู้ใช้สามารถอ่านโปรไฟล์ของตัวเองได้ (สำคัญมาก - ต้องมาก่อน)
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admin สามารถอ่านโปรไฟล์ทั้งหมดได้ (ใช้ function ที่สร้างไว้)
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (public.is_admin());

-- Policy 3: ผู้ใช้สามารถอัปเดตโปรไฟล์ของตัวเองได้
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: ผู้ใช้สามารถสร้างโปรไฟล์ของตัวเองได้
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 5: Admin สามารถอัปเดตโปรไฟล์ทั้งหมดได้
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- ตรวจสอบว่า policies ทำงานถูกต้อง
-- ============================================

-- ทดสอบ: ตรวจสอบว่า function ทำงานถูกต้อง
-- SELECT public.is_admin();

-- ทดสอบ: ตรวจสอบว่าสามารถอ่านโปรไฟล์ของตัวเองได้
-- SELECT * FROM profiles WHERE id = auth.uid();

-- ============================================
-- หมายเหตุ:
-- 1. Function is_admin() ใช้ SECURITY DEFINER เพื่อให้สามารถอ่าน profiles ได้โดยไม่ถูก RLS บล็อก
-- 2. Policy "Users can view own profile" ต้องมาก่อน policy อื่นๆ เพื่อให้ผู้ใช้สามารถอ่านโปรไฟล์ของตัวเองได้
-- 3. หลังจากรัน script นี้แล้ว ให้ลอง refresh หน้าเว็บและเข้าหน้า admin อีกครั้ง
-- ============================================

