-- ============================================
-- เพิ่ม RLS Policy สำหรับให้ผู้ใช้สร้าง message_replies ได้
-- ============================================

-- ตรวจสอบว่า function is_admin() มีอยู่แล้วหรือไม่
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

-- เปิด RLS สำหรับตาราง message_replies (ถ้ายังไม่ได้เปิด)
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่า (ถ้ามี)
DROP POLICY IF EXISTS "Users can create replies" ON message_replies;
DROP POLICY IF EXISTS "Users can view replies to their messages" ON message_replies;
DROP POLICY IF EXISTS "Admins can view all replies" ON message_replies;
DROP POLICY IF EXISTS "Admins can create replies" ON message_replies;

-- Policy 1: ผู้ใช้สามารถอ่านการตอบกลับของข้อความตัวเองได้
CREATE POLICY "Users can view replies to their messages"
  ON message_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contact_messages
      WHERE contact_messages.id = message_replies.message_id
      AND contact_messages.user_id = auth.uid()
    )
  );

-- Policy 2: Admin สามารถอ่านการตอบกลับทั้งหมดได้
CREATE POLICY "Admins can view all replies"
  ON message_replies
  FOR SELECT
  USING (public.is_admin());

-- Policy 3: ผู้ใช้สามารถสร้างการตอบกลับได้ (ส่งข้อความใหม่ในแชท)
CREATE POLICY "Users can create replies"
  ON message_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_messages
      WHERE contact_messages.id = message_replies.message_id
      AND contact_messages.user_id = auth.uid()
      AND message_replies.sender = 'user'
    )
  );

-- Policy 4: Admin สามารถสร้างการตอบกลับได้
CREATE POLICY "Admins can create replies"
  ON message_replies
  FOR INSERT
  WITH CHECK (
    public.is_admin() AND message_replies.sender = 'admin'
  );

-- ============================================
-- หมายเหตุ:
-- 1. Policy "Users can create replies" อนุญาตให้ผู้ใช้สร้างข้อความใหม่ในแชทได้
-- 2. ตรวจสอบว่า message_id ตรงกับข้อความของผู้ใช้และ sender = 'user'
-- 3. หลังจากรัน script นี้แล้ว ให้ลอง refresh หน้าเว็บและทดสอบส่งข้อความ
-- ============================================

