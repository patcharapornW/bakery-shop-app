import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const fileName = `cakes/${Date.now()}-${file.name}`
  // อัปโหลดรูปภาพจาก storage
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    // อัปโหลดรูปภาพไม่สำเร็จ ไม่ต้องยกเลิกการทำงานอื่น
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ดึง URL รูปภาพจาก storage
  const { publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path).data

  return NextResponse.json({ url: publicUrl })
}
