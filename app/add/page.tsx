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
        <p className="eyebrow">Add Entry</p>
        <h1>New Transaction</h1>
        <p className="subtle">เพิ่มบิลขาย ซื้อไม้ รายจ่าย โอนเงิน และเงินตั้งต้น</p>
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
