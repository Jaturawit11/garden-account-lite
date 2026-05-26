"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CalendarDays, ReceiptText, Sprout, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { filterByDateRange, summarizeTransactions, todayString } from "@/lib/finance";
import { fetchTransactions } from "@/lib/supabase";
import type { Transaction } from "@/lib/types";

type Mode = "day" | "month" | "year" | "custom";

export default function SummaryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mode, setMode] = useState<Mode>("month");
  const [start, setStart] = useState(todayString().slice(0, 8) + "01");
  const [end, setEnd] = useState(todayString());

  useEffect(() => {
    fetchTransactions().then(setTransactions);
  }, []);

  function applyMode(nextMode: Mode) {
    const now = new Date();
    setMode(nextMode);
    if (nextMode === "day") {
      const today = todayString();
      setStart(today);
      setEnd(today);
    }
    if (nextMode === "month") {
      setStart(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10));
    }
    if (nextMode === "year") {
      setStart(`${now.getFullYear()}-01-01`);
      setEnd(`${now.getFullYear()}-12-31`);
    }
  }

  const summary = useMemo(() => summarizeTransactions(filterByDateRange(transactions, start, end)), [transactions, start, end]);
  const allTimeCapital = useMemo(() => summarizeTransactions(transactions).gardenCapital, [transactions]);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Summary</p>
        <h1>Daily Monthly Yearly</h1>
        <p className="subtle">ดูยอดขาย รายจ่าย กำไร ทุนค้าง จำนวนบิล และเลือกช่วงวันที่เองได้</p>
      </section>

      <section className="section card panel">
        <div className="button-row">
          <button className={`btn ${mode === "day" ? "" : "secondary"}`} type="button" onClick={() => applyMode("day")}>รายวัน</button>
          <button className={`btn ${mode === "month" ? "" : "secondary"}`} type="button" onClick={() => applyMode("month")}>รายเดือน</button>
          <button className={`btn ${mode === "year" ? "" : "secondary"}`} type="button" onClick={() => applyMode("year")}>รายปี</button>
          <button className={`btn ${mode === "custom" ? "" : "secondary"}`} type="button" onClick={() => setMode("custom")}>กำหนดเอง</button>
        </div>
        <div className="two-col" style={{ marginTop: 12 }}>
          <label className="field">
            <span>ตั้งแต่</span>
            <input className="control" type="date" value={start} onChange={(event) => { setMode("custom"); setStart(event.target.value); }} />
          </label>
          <label className="field">
            <span>ถึง</span>
            <input className="control" type="date" value={end} onChange={(event) => { setMode("custom"); setEnd(event.target.value); }} />
          </label>
        </div>
      </section>

      <section className="section grid metrics">
        <MetricCard label="ยอดขาย" value={summary.sales} icon={ReceiptText} tone="good" signed />
        <MetricCard label="รายจ่าย" value={-summary.expenses} icon={Banknote} tone="bad" signed />
        <MetricCard label="กำไร" value={summary.profit} icon={TrendingUp} tone="auto" signed />
        <MetricCard label="ทุนค้างในสวน" value={allTimeCapital} icon={Sprout} />
        <MetricCard label="จำนวนบิล" value={summary.billCount} icon={CalendarDays} />
      </section>
    </main>
  );
}
