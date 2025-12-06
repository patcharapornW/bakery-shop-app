-- ============================================
-- แก้ไข RLS Policies สำหรับ profiles table
-- เพื่อให้ admin สามารถอ่านโปรไฟล์ของตัวเองได้
-- ============================================

-- ลบ policies เก่าที่อาจมีปัญหา
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy 1: ผู้ใช้สามารถอ่านโปรไฟล์ของตัวเองได้ (รวม admin ด้วย)
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admin สามารถอ่านโปรไฟล์ทั้งหมดได้
-- ใช้ SECURITY DEFINER function เพื่อหลีกเลี่ยง recursive query
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

-- Policy สำหรับ admin อ่านโปรไฟล์ทั้งหมด
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

-- Policy 5: Admin สามารถอัปเดตโปรไฟล์ทั้งหมดได้ (สำหรับเปลี่ยน role)
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- หมายเหตุ:
-- 1. รัน SQL นี้ใน Supabase SQL Editor
-- 2. Function is_admin() ใช้ SECURITY DEFINER เพื่อให้สามารถอ่าน profiles ได้โดยไม่เกิด recursive query
-- 3. ตรวจสอบว่า policies ทำงานถูกต้องโดยลอง query:
--    SELECT * FROM profiles WHERE id = auth.uid();
-- ============================================

