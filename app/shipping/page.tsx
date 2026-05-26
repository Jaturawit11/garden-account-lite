"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackageCheck, RotateCcw, Search } from "lucide-react";
import { Toast } from "@/components/Toast";
import { customerCountryLabels, deliveryStatusLabels } from "@/lib/types";
import { fetchTransactions, updateSaleItemDelivery } from "@/lib/supabase";
import { billCode, toMoney } from "@/lib/finance";
import type { CustomerCountry, DeliveryStatus, SaleItem, Transaction } from "@/lib/types";

type DeliveryItem = {
  item: SaleItem;
  transaction: Transaction;
};

type CustomerGroup = {
  key: string;
  name: string;
  country: CustomerCountry | null;
  items: DeliveryItem[];
};

export default function ShippingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "all">("holding");
  const [message, setMessage] = useState("");

  async function load() {
    setTransactions(await fetchTransactions());
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, CustomerGroup>();
    transactions
      .filter((transaction) => transaction.type === "sale")
      .forEach((transaction) => {
        const name = (transaction.customer_name || "ไม่ระบุชื่อลูกค้า").trim();
        const key = name.toLowerCase();
        const country = transaction.customer_country ?? null;
        if (!map.has(key)) map.set(key, { key, name, country, items: [] });

        (transaction.sale_items ?? []).forEach((item) => {
          const itemStatus = item.delivery_status ?? "holding";
          if (status !== "all" && itemStatus !== status) return;
          map.get(key)?.items.push({ item: { ...item, delivery_status: itemStatus }, transaction });
        });
      });

    const needle = query.trim().toLowerCase();
    return Array.from(map.values())
      .filter((group) => {
        if (!group.items.length) return false;
        const haystack = [
          group.name,
          group.country ? customerCountryLabels[group.country] : "",
          ...group.items.map(({ item }) => item.plant_name)
        ]
          .join(" ")
          .toLowerCase();
        return !needle || haystack.includes(needle);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [transactions, query, status]);

  async function setDelivery(itemId: string | undefined, nextStatus: DeliveryStatus) {
    if (!itemId) return;
    await updateSaleItemDelivery(itemId, nextStatus);
    setMessage(nextStatus === "delivered" ? "บันทึกว่าส่งแล้ว" : "ย้ายกลับไปฝากไว้แล้ว");
    window.setTimeout(() => setMessage(""), 2200);
    await load();
  }

  return (
    <main className="page">
      <Toast message={message} onClose={() => setMessage("")} />
      <section className="hero">
        <p className="eyebrow">Delivery</p>
        <h1>Holding Plants</h1>
        <p className="subtle">รวมต้นไม้ที่ลูกค้าฝากไว้ตามชื่อลูกค้า ถ้าพิมพ์ชื่อเหมือนกัน ระบบจะรวมรายการให้เอง</p>
      </section>

      <section className="section card panel">
        <div className="shipping-toolbar">
          <label className="field">
            <span>ค้นหาลูกค้า/ต้นไม้/ประเทศ</span>
            <div className="input-with-icon">
              <Search size={17} aria-hidden />
              <input className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น Nisa, มอนสเตอร่า, ไทย" />
            </div>
          </label>
          <label className="field">
            <span>สถานะจัดส่ง</span>
            <select className="control" value={status} onChange={(event) => setStatus(event.target.value as DeliveryStatus | "all")}>
              <option value="holding">ฝากไว้</option>
              <option value="delivered">ส่งแล้ว</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </label>
        </div>
      </section>

      <section className="section delivery-list">
        {groups.length === 0 && <div className="card empty">ยังไม่มีรายการฝากส่ง</div>}
        {groups.map((group) => {
          const holdingCount = group.items.filter(({ item }) => (item.delivery_status ?? "holding") === "holding").length;
          const totalValue = group.items.reduce((sum, { item }) => sum + Number(item.sale_price || 0), 0);
          return (
            <article className="card panel delivery-card" key={group.key}>
              <div className="delivery-head">
                <div>
                  <p className="eyebrow">Customer</p>
                  <h2>
                    {group.country && <span className="country-flag">{customerCountryLabels[group.country].split(" ")[0]}</span>}
                    {group.name}
                  </h2>
                  <p className="subtle">
                    ฝากไว้ {holdingCount.toLocaleString("th-TH")} ต้น | รวม {group.items.length.toLocaleString("th-TH")} รายการ | มูลค่า {toMoney(totalValue)}
                  </p>
                </div>
              </div>

              <div className="delivery-items">
                {group.items.map(({ item, transaction }) => {
                  const itemStatus = item.delivery_status ?? "holding";
                  return (
                    <div className="delivery-item" key={item.id ?? `${transaction.id}-${item.plant_name}`}>
                      <div>
                        <strong>{item.plant_name}</strong>
                        <p className="meta">
                          {billCode(transaction.id)} | {transaction.transaction_date} | {toMoney(item.sale_price)}
                        </p>
                      </div>
                      <span className={`delivery-pill ${itemStatus}`}>{deliveryStatusLabels[itemStatus]}</span>
                      {itemStatus === "holding" ? (
                        <button className="btn delivery-action" type="button" onClick={() => setDelivery(item.id, "delivered")}>
                          <PackageCheck size={17} /> ส่งแล้ว
                        </button>
                      ) : (
                        <button className="btn secondary delivery-action" type="button" onClick={() => setDelivery(item.id, "holding")}>
                          <RotateCcw size={17} /> ฝากไว้
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
