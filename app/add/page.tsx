"use client";

import { useState } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { Toast } from "@/components/Toast";
import { saveTransaction } from "@/lib/supabase";

export default function AddPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="page">
      <Toast message={message} onClose={() => setMessage("")} />
      <section className="hero">
        <p className="eyebrow">เพิ่มรายการ</p>
        <h1>ลงบิลขาย ซื้อไม้ รายจ่าย และโอนเงิน</h1>
        <p className="subtle">บิลขายเพิ่มรายการย่อยได้หลายต้น ระบบรวมทุน ราคาขาย และกำไรให้อัตโนมัติ</p>
      </section>
      <TransactionForm
        onSubmit={async (input) => {
          await saveTransaction(input);
          setMessage("บันทึกรายการสำเร็จ");
          window.setTimeout(() => setMessage(""), 2600);
        }}
      />
    </main>
  );
}
