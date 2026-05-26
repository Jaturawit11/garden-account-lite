export type WalletName = "time" | "nisa";

export type TransactionType =
  | "plant_purchase"
  | "sale"
  | "business_expense"
  | "personal_expense"
  | "wallet_transfer"
  | "opening_balance"
  | "other_income";

export type PaymentStatus = "paid" | "unpaid" | "partial";
export type CustomerCountry = "TH" | "US" | "PH" | "VN" | "ID" | "SG";
export type DeliveryStatus = "holding" | "delivered";

export type SaleItem = {
  id?: string;
  transaction_id?: string;
  plant_name: string;
  cost: number;
  sale_price: number;
  profit?: number;
  delivery_status?: DeliveryStatus;
  delivered_at?: string | null;
};

export type Transaction = {
  id: string;
  transaction_date: string;
  type: TransactionType;
  description: string | null;
  customer_name: string | null;
  customer_country: CustomerCountry | null;
  wallet_from: WalletName | null;
  wallet_to: WalletName | null;
  amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  note: string | null;
  created_at?: string;
  updated_at?: string;
  sale_items?: SaleItem[];
};

export type TransactionInput = Omit<Transaction, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  plant_purchase: "ซื้อไม้เข้าสวน",
  sale: "ขายไม้",
  business_expense: "รายจ่ายธุรกิจ",
  personal_expense: "รายจ่ายส่วนตัว",
  wallet_transfer: "โอน Time/Nisa",
  opening_balance: "เงินตั้งต้นกระเป๋า",
  other_income: "รายรับอื่น"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "จ่ายแล้ว",
  unpaid: "ยังไม่จ่าย",
  partial: "จ่ายบางส่วน"
};

export const walletLabels: Record<WalletName, string> = {
  time: "Time",
  nisa: "Nisa"
};

export const customerCountryLabels: Record<CustomerCountry, string> = {
  TH: "🇹🇭 ไทย",
  US: "🇺🇸 เมกา",
  PH: "🇵🇭 ฟิลิปปินส์",
  VN: "🇻🇳 เวียดนาม",
  ID: "🇮🇩 อินโด",
  SG: "🇸🇬 สิงคโปร์"
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  holding: "ฝากไว้",
  delivered: "ส่งแล้ว"
};
