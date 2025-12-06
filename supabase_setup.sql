-- ============================================
-- SQL Script สำหรับตั้งค่า Supabase Database
-- สำหรับระบบจัดการข้อความและออเดอร์
-- ============================================

-- 1. สร้างตาราง contact_messages สำหรับเก็บข้อความจากลูกค้า
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'replied', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. สร้างตาราง message_replies สำหรับเก็บการตอบกลับ
CREATE TABLE IF NOT EXISTS message_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES contact_messages(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
  text TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. สร้างตาราง profiles (ถ้ายังไม่มี)
-- ตรวจสอบว่ามีตาราง profiles อยู่แล้วหรือไม่
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- 4. สร้าง Function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. สร้าง Trigger สำหรับอัปเดต updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. สร้าง Index เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- 7. เปิด RLS สำหรับตาราง contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: ผู้ใช้ทั่วไปสามารถอ่านข้อความของตัวเองได้
CREATE POLICY "Users can view their own messages"
  ON contact_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: ผู้ใช้ทั่วไปสามารถสร้างข้อความได้
CREATE POLICY "Users can create messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin สามารถอ่านข้อความทั้งหมดได้
CREATE POLICY "Admins can view all messages"
  ON contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin สามารถอัปเดตข้อความได้ (เปลี่ยนสถานะ)
CREATE POLICY "Admins can update messages"
  ON contact_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 8. เปิด RLS สำหรับตาราง message_replies
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Policy: ผู้ใช้ทั่วไปสามารถอ่านการตอบกลับของข้อความตัวเองได้
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

-- Policy: Admin สามารถอ่านการตอบกลับทั้งหมดได้
CREATE POLICY "Admins can view all replies"
  ON message_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin สามารถสร้างการตอบกลับได้
CREATE POLICY "Admins can create replies"
  ON message_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 9. เปิด RLS สำหรับตาราง profiles (ถ้ายังไม่มี)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: ผู้ใช้สามารถอ่านโปรไฟล์ของตัวเองได้
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: ผู้ใช้สามารถอัปเดตโปรไฟล์ของตัวเองได้
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admin สามารถอ่านโปรไฟล์ทั้งหมดได้
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: ผู้ใช้สามารถสร้างโปรไฟล์ของตัวเองได้ (เมื่อสมัครสมาชิก)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Function สำหรับสร้างโปรไฟล์อัตโนมัติเมื่อสมัครสมาชิก
-- ============================================

-- 10. สร้าง Function สำหรับสร้างโปรไฟล์อัตโนมัติ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. สร้าง Trigger สำหรับสร้างโปรไฟล์อัตโนมัติ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- หมายเหตุ:
-- 1. รัน SQL นี้ใน Supabase SQL Editor
-- 2. หลังจากรันแล้ว ให้ตั้งค่า role = 'admin' สำหรับบัญชีที่ต้องการเป็น admin:
--    UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
-- 3. ตรวจสอบว่า RLS policies ทำงานถูกต้อง
-- ============================================

