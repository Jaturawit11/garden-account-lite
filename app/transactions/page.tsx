"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Search, Trash2 } from "lucide-react";
import { TransactionForm } from "@/components/TransactionForm";
import { Toast } from "@/components/Toast";
import { billCode, moneyTone, saleTotals, toMoney, toSignedMoney, transactionCashImpact, typeMatches } from "@/lib/finance";
import { deleteTransaction, fetchTransactions, saveTransaction } from "@/lib/supabase";
import { paymentStatusLabels, transactionTypeLabels } from "@/lib/types";
import type { Transaction, TransactionType } from "@/lib/types";

type TypeFilter = TransactionType | "all";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setTransactions(await fetchTransactions());
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const dateOk = (!start || transaction.transaction_date >= start) && (!end || transaction.transaction_date <= end);
      const typeOk = typeMatches(transaction, type);
      const haystack = [
        transaction.customer_name,
        transaction.description,
        transaction.note,
        ...(transaction.sale_items ?? []).map((item) => item.plant_name)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const queryOk = !needle || haystack.includes(needle);
      return dateOk && typeOk && queryOk;
    });
  }, [transactions, query, type, start, end]);

  return (
    <main className="page">
      <Toast message={message} onClose={() => setMessage("")} />
      <section className="hero">
        <p className="eyebrow">รายการทั้งหมด</p>
        <h1>ดู กรอง ค้นหา แก้ไข และลบธุรกรรม</h1>
        <p className="subtle">เมื่อใช้ Supabase การแก้ไขและลบจะถูกเก็บในตารางประวัติ audit_logs</p>
      </section>

      {editing && (
        <section className="section">
          <h2>แก้ไขรายการ</h2>
          <TransactionForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              await saveTransaction(input);
              setEditing(null);
              setMessage("แก้ไขรายการสำเร็จ");
              window.setTimeout(() => setMessage(""), 2600);
              await load();
            }}
          />
        </section>
      )}

      <section className="section card panel">
        <div className="toolbar">
          <label className="field">
            <span>ค้นหาลูกค้า/ชื่อต้นไม้</span>
            <input className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="พิมพ์เพื่อค้นหา" />
          </label>
          <label className="field">
            <span>ตั้งแต่</span>
            <input className="control" type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className="field">
            <span>ถึง</span>
            <input className="control" type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
          <label className="field">
            <span>ประเภท</span>
            <select className="control" value={type} onChange={(event) => setType(event.target.value as TypeFilter)}>
              <option value="all">ทั้งหมด</option>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="list">
          {filtered.length === 0 && <div className="empty">ไม่พบรายการ</div>}
          {filtered.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onEdit={() => setEditing(transaction)}
              onDelete={async () => {
                await deleteTransaction(transaction.id);
                setMessage("ลบรายการสำเร็จ");
                window.setTimeout(() => setMessage(""), 2600);
                await load();
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function TransactionCard({ transaction, onEdit, onDelete }: { transaction: Transaction; onEdit: () => void; onDelete: () => void }) {
  const totals = saleTotals(transaction);
  const cashImpact = transactionCashImpact(transaction);
  const amount = transaction.type === "sale" ? totals.sales : transaction.amount;

  return (
    <article className="card transaction">
      <div className="transaction-head">
        <div>
          <span className="pill">{transactionTypeLabels[transaction.type]}</span>
          <h3>{transaction.customer_name || transaction.description || "ไม่มีชื่อรายการ"}</h3>
          <div className="meta">
            {billCode(transaction.id)} | {transaction.transaction_date} | {paymentStatusLabels[transaction.payment_status]}
            {transaction.payment_status === "partial" && ` | จ่ายแล้ว ${toMoney(transaction.paid_amount)}`}
          </div>
        </div>
        <div className={`amount ${moneyTone(cashImpact)}`}>{cashImpact === 0 ? toMoney(amount) : toSignedMoney(cashImpact)}</div>
      </div>
      {transaction.type === "sale" && (
        <div className="items">
          {(transaction.sale_items ?? []).map((item, index) => (
            <div className="item-line" key={item.id ?? index}>
              <span>{item.plant_name}</span>
              <strong><span className="money-negative">-{toMoney(item.cost)}</span> | <span className="money-positive">+{toMoney(item.sale_price)}</span></strong>
            </div>
          ))}
          <div className="item-line">
            <span>รวมกำไรบิล</span>
            <strong className={moneyTone(totals.profit)}>{toSignedMoney(totals.profit)}</strong>
          </div>
        </div>
      )}
      <div className="button-row" style={{ marginTop: 12 }}>
        <button className="btn secondary icon" type="button" title="แก้ไข" onClick={onEdit}>
          <Edit3 size={17} />
        </button>
        <button className="btn danger icon" type="button" title="ลบ" onClick={onDelete}>
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
