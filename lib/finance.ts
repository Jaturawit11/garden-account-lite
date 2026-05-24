import type { Transaction, TransactionInput, TransactionType, WalletName } from "./types";

export type MoneySummary = {
  sales: number;
  expenses: number;
  profit: number;
  gardenCapital: number;
  billCount: number;
  wallets: Record<WalletName, number>;
};

export type DashboardSummary = MoneySummary & {
  previous: Pick<MoneySummary, "sales" | "expenses" | "profit">;
  changes: Record<"sales" | "expenses" | "profit", { percent: number; amount: number }>;
  forecast: { sales: number; profit: number };
};

export const todayString = () => new Date().toISOString().slice(0, 10);

export function toMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function toSignedMoney(value: number, forceSign = true) {
  const amount = toMoney(Math.abs(value));
  if (!forceSign || value === 0) return amount;
  return `${value > 0 ? "+" : "-"}${amount}`;
}

export function moneyTone(value: number) {
  if (value > 0) return "money-positive";
  if (value < 0) return "money-negative";
  return "money-neutral";
}

export function saleTotals(transaction: Pick<Transaction, "sale_items" | "amount">) {
  const items = transaction.sale_items ?? [];
  const cost = items.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const sales = items.length
    ? items.reduce((sum, item) => sum + Number(item.sale_price || 0), 0)
    : Number(transaction.amount || 0);

  return { cost, sales, profit: sales - cost };
}

export function summarizeTransactions(transactions: Transaction[]): MoneySummary {
  return transactions.reduce<MoneySummary>(
    (summary, transaction) => {
      const amount = Number(transaction.amount || 0);
      const paid = Number(transaction.paid_amount || 0);

      if (transaction.type === "plant_purchase") {
        summary.gardenCapital += amount;
        if (transaction.wallet_from) summary.wallets[transaction.wallet_from] -= amount;
      }

      if (transaction.type === "sale") {
        const totals = saleTotals(transaction);
        summary.sales += totals.sales;
        summary.profit += totals.profit;
        summary.gardenCapital -= totals.cost;
        summary.billCount += 1;
        if (transaction.wallet_to) summary.wallets[transaction.wallet_to] += paid;
      }

      if (transaction.type === "business_expense") {
        summary.expenses += amount;
        summary.profit -= amount;
        if (transaction.wallet_from) summary.wallets[transaction.wallet_from] -= amount;
      }

      if (transaction.type === "personal_expense" && transaction.wallet_from) {
        summary.wallets[transaction.wallet_from] -= amount;
      }

      if (transaction.type === "wallet_transfer" && transaction.wallet_from && transaction.wallet_to) {
        summary.wallets[transaction.wallet_from] -= amount;
        summary.wallets[transaction.wallet_to] += amount;
      }

      if (transaction.type === "other_income") {
        summary.profit += amount;
        if (transaction.wallet_to) summary.wallets[transaction.wallet_to] += paid || amount;
      }

      return summary;
    },
    {
      sales: 0,
      expenses: 0,
      profit: 0,
      gardenCapital: 0,
      billCount: 0,
      wallets: { time: 0, nisa: 0 }
    }
  );
}

export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    daysInMonth: end.getDate(),
    dayOfMonth: date.getDate()
  };
}

export function previousMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function filterByDateRange(transactions: Transaction[], start: string, end: string) {
  return transactions.filter((transaction) => {
    return transaction.transaction_date >= start && transaction.transaction_date <= end;
  });
}

export function dashboardSummary(transactions: Transaction[], date = new Date()): DashboardSummary {
  const currentRange = monthRange(date);
  const previousRange = previousMonthRange(date);
  const allTime = summarizeTransactions(transactions);
  const current = summarizeTransactions(filterByDateRange(transactions, currentRange.start, currentRange.end));
  const previous = summarizeTransactions(filterByDateRange(transactions, previousRange.start, previousRange.end));
  const makeChange = (now: number, before: number) => ({
    amount: now - before,
    percent: before === 0 ? (now === 0 ? 0 : 100) : ((now - before) / Math.abs(before)) * 100
  });

  return {
    ...current,
    gardenCapital: allTime.gardenCapital,
    wallets: allTime.wallets,
    previous,
    changes: {
      sales: makeChange(current.sales, previous.sales),
      expenses: makeChange(current.expenses, previous.expenses),
      profit: makeChange(current.profit, previous.profit)
    },
    forecast: {
      sales: (current.sales / currentRange.dayOfMonth) * currentRange.daysInMonth,
      profit: (current.profit / currentRange.dayOfMonth) * currentRange.daysInMonth
    }
  };
}

export function normalizeInput(input: TransactionInput): TransactionInput {
  if (input.type === "sale") {
    const totals = saleTotals(input);
    const paidAmount =
      input.payment_status === "paid"
        ? totals.sales
        : input.payment_status === "unpaid"
          ? 0
          : Number(input.paid_amount || 0);
    return {
      ...input,
      amount: totals.sales,
      paid_amount: paidAmount
    };
  }

  if (input.payment_status === "unpaid") return { ...input, paid_amount: 0 };
  if (input.payment_status === "paid") return { ...input, paid_amount: Number(input.amount || 0) };
  return input;
}

export function typeMatches(transaction: Transaction, type: TransactionType | "all") {
  return type === "all" || transaction.type === type;
}

export function transactionCashImpact(transaction: Transaction) {
  if (transaction.type === "sale" || transaction.type === "other_income") return Number(transaction.paid_amount || transaction.amount || 0);
  if (transaction.type === "plant_purchase" || transaction.type === "business_expense" || transaction.type === "personal_expense") {
    return -Number(transaction.amount || 0);
  }
  return 0;
}

export function billCode(id: string) {
  return `บิล #${id.slice(0, 8).toUpperCase()}`;
}
