"use client";

import React from "react";
import { AlertTriangle, Check, Info } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onCancel?: () => void;
  type?: "success" | "error" | "info"; // เพิ่มประเภทเพื่อเปลี่ยนสีไอคอน
  showCancel?: boolean;
  okText?: string;
  cancelText?: string;
}

const toneMap = {
  success: {
    icon: Check,
    wrapper: "bg-green-100 text-green-600",
  },
  error: {
    icon: AlertTriangle,
    wrapper: "bg-red-100 text-red-600",
  },
  info: {
    icon: Info,
    wrapper: "bg-stone-100 text-stone-600",
  },
} as const;

export default function AlertModal({
  isOpen,
  title,
  message,
  onClose,
  onCancel = () => {},
  type = "info",
  showCancel = false,
  okText = "ตกลง",
  cancelText = "ยกเลิก",
}: AlertModalProps) {
  if (!isOpen) return null;

  const Icon = toneMap[type].icon;
  const toneClass = toneMap[type].wrapper;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-stone-100 text-center animate-in zoom-in-95 duration-200 scale-100">
        {/* ไอคอน */}
        <div className="mb-4 flex justify-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${toneClass}`}
          >
            <Icon className="w-6 h-6" strokeWidth={2.5} />
          </div>
        </div>

        <h3 className="text-xl font-bold text-stone-800 mb-2">{title}</h3>
        <p className="text-stone-600 mb-6 text-sm leading-relaxed">{message}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          {showCancel && (
            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-white text-stone-600 font-bold rounded-xl border border-stone-200 hover:bg-stone-50 transition-all transform active:scale-95 shadow-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-900 transition-all transform active:scale-95 shadow-md"
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}
