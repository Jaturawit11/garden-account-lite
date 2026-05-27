"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus, Save, Trash2 } from "lucide-react";
import { moneyTone, saleTotals, todayString, toMoney, toSignedMoney } from "@/lib/finance";
import { customerCountryLabels, paymentStatusLabels, transactionTypeLabels, walletLabels } from "@/lib/types";
import type { CustomerCountry, SaleItem, Transaction, TransactionInput, TransactionType, WalletName } from "@/lib/types";

type TransactionFormProps = {
  initial?: Transaction | null;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancel?: () => void;
};

const emptySaleItem: SaleItem = { plant_name: "", cost: 0, sale_price: 0, delivery_status: "holding", delivered_at: null };
const numberValue = (value: number | undefined) => (Number(value || 0) === 0 ? "" : String(value));
const numberFromInput = (value: string) => {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (cleaned === "") return 0;
  return Number(cleaned);
};

export function TransactionForm({ initial, onSubmit, onCancel }: TransactionFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TransactionInput>(
    initial ?? {
      transaction_date: todayString(),
      type: "sale",
      description: "",
      customer_name: "",
      customer_country: null,
      wallet_from: null,
      wallet_to: "time",
      amount: 0,
      paid_amount: 0,
      payment_status: "paid",
      note: "",
      sale_items: [{ ...emptySaleItem }]
    }
  );

  const totals = useMemo(() => saleTotals(form), [form]);
  const isSale = form.type === "sale";
  const needsWalletFrom = ["plant_purchase", "business_expense", "personal_expense", "wallet_transfer"].includes(form.type);
  const needsWalletTo = ["sale", "wallet_transfer", "opening_balance", "other_income"].includes(form.type);

  function update<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateType(type: TransactionType) {
    setForm((current) => ({
      ...current,
      type,
      sale_items: type === "sale" ? current.sale_items?.length ? current.sale_items : [{ ...emptySaleItem }] : [],
      customer_name: type === "sale" ? current.customer_name : "",
      customer_country: type === "sale" ? current.customer_country : null,
      wallet_from: type === "wallet_transfer" ? "time" : ["plant_purchase", "business_expense", "personal_expense"].includes(type) ? current.wallet_from ?? "time" : null,
      wallet_to: ["sale", "opening_balance", "other_income"].includes(type) ? current.wallet_to ?? "time" : type === "wallet_transfer" ? "nisa" : null,
      payment_status: type === "sale" ? current.payment_status : "paid"
    }));
  }

  function updateItem(index: number, key: keyof SaleItem, value: string) {
    setForm((current) => ({
      ...current,
      sale_items: (current.sale_items ?? []).map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: key === "plant_name" ? value : Number(value || 0) }
          : item
      )
    }));
  }

  async function submit() {
    setSaving(true);
    try {
      const fullAmount = isSale ? totals.sales : Number(form.amount || 0);
      const paidAmount = isSale
        ? form.payment_status === "paid"
          ? fullAmount
          : form.payment_status === "unpaid"
            ? 0
            : Number(form.paid_amount || 0)
        : fullAmount;
      await onSubmit({
        ...form,
        amount: fullAmount,
        paid_amount: paidAmount,
        payment_status: isSale ? form.payment_status : "paid",
        sale_items: isSale ? (form.sale_items ?? []).filter((item) => item.plant_name.trim()) : []
      });
      if (!initial) {
        setForm({
          transaction_date: todayString(),
          type: "sale",
          description: "",
          customer_name: "",
          customer_country: null,
          wallet_from: null,
          wallet_to: "time",
          amount: 0,
          paid_amount: 0,
          payment_status: "paid",
          note: "",
          sale_items: [{ ...emptySaleItem }]
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card panel">
      <div className="form-grid">
        <div className="compact-row compact-row-top">
          <label className="field">
            <span>วันที่</span>
            <input className="control" type="date" value={form.transaction_date} onChange={(event) => update("transaction_date", event.target.value)} />
          </label>
          <label className="field">
            <span>ประเภท</span>
            <select className="control" value={form.type} onChange={(event) => updateType(event.target.value as TransactionType)}>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {isSale && (
          <div className="compact-row compact-row-sale">
            <label className="field">
              <span>ลูกค้า</span>
              <input className="control" value={form.customer_name ?? ""} onChange={(event) => update("customer_name", event.target.value)} />
            </label>
            <label className="field">
              <span>ประเทศ</span>
              <select className="control" value={form.customer_country ?? ""} onChange={(event) => update("customer_country", (event.target.value || null) as CustomerCountry | null)}>
                <option value="">ไม่ระบุ</option>
                {Object.entries(customerCountryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>รับเงินเข้า</span>
              <WalletSelect value={form.wallet_to} onChange={(value) => update("wallet_to", value)} />
            </label>
            <label className="field">
              <span>สถานะจ่ายเงิน</span>
              <div className="segmented compact-payment" role="group" aria-label="สถานะจ่ายเงิน">
                {(Object.keys(paymentStatusLabels) as TransactionInput["payment_status"][]).map((status) => {
                  const active = form.payment_status === status;
                  const Icon = active ? CheckCircle2 : Circle;
                  return (
                    <button
                      className={`segment segment-${status} ${active ? "active" : ""}`}
                      key={status}
                      type="button"
                      onClick={() => update("payment_status", status)}
                    >
                      <Icon size={15} aria-hidden />
                      {paymentStatusLabels[status]}
                    </button>
                  );
                })}
              </div>
            </label>
          </div>
        )}

        {!isSale && (
          <label className="field">
            <span>รายละเอียด</span>
            <input className="control" value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} />
          </label>
        )}

        {!isSale && (
          <div className="three-col">
            <label className="field">
              <span>จำนวนเงิน</span>
              <input className="control" type="text" inputMode="decimal" placeholder="0" value={numberValue(form.amount)} onFocus={(event) => event.currentTarget.select()} onChange={(event) => update("amount", numberFromInput(event.target.value))} />
            </label>
            {needsWalletFrom && (
              <label className="field">
                <span>หักจาก</span>
                <WalletSelect value={form.wallet_from} onChange={(value) => update("wallet_from", value)} />
              </label>
            )}
            {needsWalletTo && (
              <label className="field">
                <span>เข้ากระเป๋า</span>
                <WalletSelect value={form.wallet_to} onChange={(value) => update("wallet_to", value)} />
              </label>
            )}
          </div>
        )}

        {isSale && (
          <section className="grid">
            {(form.sale_items ?? []).map((item, index) => (
              <div className="sale-item" key={index}>
                <label className="field sale-plant-field">
                  <span>ชื่อต้นไม้</span>
                  <input className="control" value={item.plant_name} onChange={(event) => updateItem(index, "plant_name", event.target.value)} />
                </label>
                <label className="field sale-money-field">
                  <span>ทุน</span>
                  <input className="control" type="text" inputMode="decimal" placeholder="0" value={numberValue(item.cost)} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateItem(index, "cost", event.target.value)} />
                </label>
                <label className="field sale-money-field">
                  <span>ราคาขาย</span>
                  <input className="control" type="text" inputMode="decimal" placeholder="0" value={numberValue(item.sale_price)} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateItem(index, "sale_price", event.target.value)} />
                </label>
                <label className="field sale-money-field">
                  <span>กำไร</span>
                  <input className={`control ${Number(item.sale_price || 0) - Number(item.cost || 0) < 0 ? "money-negative" : "money-positive"}`} readOnly value={Number(item.sale_price || 0) - Number(item.cost || 0)} />
                </label>
                {(form.sale_items ?? []).length > 1 && (
                  <button className="btn secondary icon sale-remove" type="button" title="ลบรายการย่อย" onClick={() => update("sale_items", (form.sale_items ?? []).filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button className="btn secondary" type="button" onClick={() => update("sale_items", [...(form.sale_items ?? []), { ...emptySaleItem }])}>
              <Plus size={16} /> เพิ่มต้นไม้ในบิล
            </button>
            <div className="card panel">
              <strong>รวมบิล <span className="money-positive">{toSignedMoney(totals.sales)}</span></strong>
              <p className="subtle">
                ทุน <span className="money-negative">-{toMoney(totals.cost)}</span> | กำไร <span className={moneyTone(totals.profit)}>{toSignedMoney(totals.profit)}</span>
              </p>
            </div>
          </section>
        )}

        <div className="grid">
          {isSale && form.payment_status === "partial" && (
            <div className="two-col">
              <label className="field">
                <span>จ่ายแล้วบางส่วน</span>
                <input className="control" type="text" inputMode="decimal" placeholder="0" value={numberValue(form.paid_amount)} onFocus={(event) => event.currentTarget.select()} onChange={(event) => update("paid_amount", numberFromInput(event.target.value))} />
              </label>
              <label className="field">
                <span>ค้างจ่าย</span>
                <input className="control money-negative" readOnly value={Math.max(0, totals.sales - Number(form.paid_amount || 0)).toLocaleString("th-TH")} />
              </label>
            </div>
          )}
          <label className="field">
            <span>หมายเหตุ</span>
            <input className="control" value={form.note ?? ""} onChange={(event) => update("note", event.target.value)} />
          </label>
        </div>

        <div className="button-row">
          <button className="btn" type="button" onClick={submit} disabled={saving}>
            <Save size={17} /> {saving ? "กำลังบันทึก" : "บันทึก"}
          </button>
          {onCancel && (
            <button className="btn secondary" type="button" onClick={onCancel}>
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WalletSelect({ value, onChange }: { value: WalletName | null; onChange: (value: WalletName) => void }) {
  return (
    <select className="control" value={value ?? "time"} onChange={(event) => onChange(event.target.value as WalletName)}>
      {Object.entries(walletLabels).map(([wallet, label]) => (
        <option key={wallet} value={wallet}>{label}</option>
      ))}
    </select>
  );
}
