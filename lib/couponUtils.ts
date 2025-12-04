/**
 * Utility functions สำหรับจัดการโค้ดส่วนลดที่เก็บไว้
 */

const SAVED_COUPONS_KEY = "saved_coupons";

export interface SavedCoupon {
  code: string;
  title: string;
  savedAt: string;
}

/**
 * ดึงโค้ดส่วนลดที่เก็บไว้ทั้งหมด
 */
export function getSavedCoupons(): SavedCoupon[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SAVED_COUPONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * เก็บโค้ดส่วนลดใหม่
 */
export function saveCoupon(code: string, title: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = getSavedCoupons();
    // ตรวจสอบว่าโค้ดนี้มีอยู่แล้วหรือไม่
    if (saved.some((c) => c.code === code)) {
      return false; // มีอยู่แล้ว
    }
    saved.push({ code, title, savedAt: new Date().toISOString() });
    localStorage.setItem(SAVED_COUPONS_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

/**
 * ลบโค้ดส่วนลดที่เก็บไว้
 */
export function removeSavedCoupon(code: string): void {
  if (typeof window === "undefined") return;
  try {
    const saved = getSavedCoupons();
    const filtered = saved.filter((c) => c.code !== code);
    localStorage.setItem(SAVED_COUPONS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/**
 * ตรวจสอบว่าโค้ดนี้ถูกเก็บไว้แล้วหรือไม่
 */
export function isCouponSaved(code: string): boolean {
  const saved = getSavedCoupons();
  return saved.some((c) => c.code === code);
}

