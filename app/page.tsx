"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Banknote, LineChart, ReceiptText, Sprout, TrendingUp, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { dashboardSummary, moneyTone, toMoney, toSignedMoney, transactionCashImpact } from "@/lib/finance";
import { fetchTransactions } from "@/lib/supabase";
import type { DashboardSummary, MoneySummary } from "@/lib/finance";
import type { Transaction } from "@/lib/types";

const emptySummary: DashboardSummary = {
  sales: 0,
  expenses: 0,
  profit: 0,
  gardenCapital: 0,
  billCount: 0,
  wallets: { time: 0, nisa: 0 },
  previous: { sales: 0, expenses: 0, profit: 0 },
  changes: {
    sales: { percent: 0, amount: 0 },
    expenses: { percent: 0, amount: 0 },
    profit: { percent: 0, amount: 0 }
  },
  forecast: { sales: 0, profit: 0 }
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [recent, setRecent] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchTransactions().then((transactions) => {
      setSummary(dashboardSummary(transactions));
      setRecent(transactions.slice(0, 5));
    });
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-brand">
          <Image src="/nisa-leaf.png" alt="โลโก้ร้าน Nisa" width={92} height={92} priority />
          <div>
            <p className="eyebrow">แดชบอร์ด</p>
            <h1>Accounting Nisa Plant</h1>
            <p className="subtle">ยอดเดือนนี้ กระเป๋า Time/Nisa ทุนค้าง และคาดการณ์สิ้นเดือนจากค่าเฉลี่ยรายวัน</p>
          </div>
        </div>
      </section>

      <section className="grid metrics">
        <MetricCard label="ยอดขายเดือนนี้" value={summary.sales} icon={ReceiptText} change={summary.changes.sales} tone="good" signed />
        <MetricCard label="กำไรเดือนนี้" value={summary.profit} icon={TrendingUp} change={summary.changes.profit} tone="auto" signed />
        <MetricCard
          label="รายจ่ายเดือนนี้"
          value={-summary.expenses}
          icon={Banknote}
          change={{ percent: -summary.changes.expenses.percent, amount: -summary.changes.expenses.amount }}
          tone="bad"
          signed
        />
        <MetricCard label="ทุนค้างในสวน" value={summary.gardenCapital} icon={Sprout} />
        <MetricCard label="เงินคงเหลือ Time" value={summary.wallets.time} icon={WalletCards} tone="auto" signed />
        <MetricCard label="เงินคงเหลือ Nisa" value={summary.wallets.nisa} icon={WalletCards} tone="auto" signed />
      </section>

      <section className="section grid two-col">
        <div className="card panel">
          <h2>AI คาดการณ์สิ้นเดือน</h2>
          <p className="subtle">คำนวณแบบง่ายจากค่าเฉลี่ยรายวันของเดือนนี้</p>
          <div className="grid metrics">
            <MetricCard label="ยอดขายคาดการณ์" value={summary.forecast.sales} icon={LineChart} tone="good" signed />
            <MetricCard label="กำไรคาดการณ์" value={summary.forecast.profit} icon={TrendingUp} tone="auto" signed />
          </div>
        </div>
        <RecentTransactions transactions={recent} summary={summary} />
      </section>
    </main>
  );
}

function RecentTransactions({ transactions, summary }: { transactions: Transaction[]; summary: MoneySummary }) {
  return (
    <div className="card panel">
      <h2>ภาพรวมเร็ว</h2>
      <p className="subtle">
        เดือนนี้มี {summary.billCount.toLocaleString("th-TH")} บิล | รายจ่ายธุรกิจ {toMoney(summary.expenses)}
      </p>
      <div className="list">
        {transactions.length === 0 && <div className="empty">ยังไม่มีรายการ</div>}
        {transactions.map((transaction) => (
          <div className="item-line" key={transaction.id}>
            <span>{transaction.description || transaction.customer_name || transaction.transaction_date}</span>
            <strong className={moneyTone(transactionCashImpact(transaction))}>
              {transactionCashImpact(transaction) === 0 ? toMoney(transaction.amount) : toSignedMoney(transactionCashImpact(transaction))}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
