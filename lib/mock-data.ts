import type { Transaction } from "./types";

export const seedTransactions: Transaction[] = [
  {
    id: "seed-1",
    transaction_date: new Date().toISOString().slice(0, 10),
    type: "plant_purchase",
    description: "รับไม้รอบเช้า",
    customer_name: null,
    wallet_from: "time",
    wallet_to: null,
    amount: 3200,
    paid_amount: 3200,
    payment_status: "paid",
    note: null,
    sale_items: []
  },
  {
    id: "seed-2",
    transaction_date: new Date().toISOString().slice(0, 10),
    type: "sale",
    description: "บิลขายหน้าสวน",
    customer_name: "คุณฝน",
    wallet_from: null,
    wallet_to: "nisa",
    amount: 0,
    paid_amount: 1800,
    payment_status: "paid",
    note: null,
    sale_items: [
      { plant_name: "มอนสเตอร่า", cost: 650, sale_price: 1200 },
      { plant_name: "ฟิโลเดนดรอน", cost: 300, sale_price: 600 }
    ]
  }
];
