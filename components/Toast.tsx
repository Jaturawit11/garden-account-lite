"use client";

import { CheckCircle2, X } from "lucide-react";

type ToastProps = {
  message: string;
  onClose: () => void;
};

export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <CheckCircle2 size={19} aria-hidden />
      <span>{message}</span>
      <button className="toast-close" type="button" onClick={onClose} aria-label="ปิดข้อความแจ้งเตือน">
        <X size={16} />
      </button>
    </div>
  );
}
