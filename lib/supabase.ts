"use client";

import { createClient } from "@supabase/supabase-js";
import { seedTransactions } from "./mock-data";
import { normalizeInput } from "./finance";
import type { SaleItem, Transaction, TransactionInput } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

const storageKey = "garden-account-lite-transactions";

function localTransactions(): Transaction[] {
  if (typeof window === "undefined") return seedTransactions;
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    window.localStorage.setItem(storageKey, JSON.stringify(seedTransactions));
    return seedTransactions;
  }
  return JSON.parse(saved) as Transaction[];
}

function saveLocal(transactions: Transaction[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(transactions));
}

export async function fetchTransactions(): Promise<Transaction[]> {
  if (!supabase) return localTransactions();

  const { data, error } = await supabase
    .from("transactions")
    .select("*, sale_items(*)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function saveTransaction(input: TransactionInput): Promise<void> {
  const normalized = normalizeInput(input);
  const saleItems = normalized.sale_items ?? [];
  const payload = {
    transaction_date: normalized.transaction_date,
    type: normalized.type,
    description: normalized.description || null,
    customer_name: normalized.customer_name || null,
    customer_country: normalized.customer_country || null,
    wallet_from: normalized.wallet_from,
    wallet_to: normalized.wallet_to,
    amount: Number(normalized.amount || 0),
    paid_amount: Number(normalized.paid_amount || 0),
    payment_status: normalized.payment_status,
    note: normalized.note || null
  };

  if (!supabase) {
    const transactions = localTransactions();
    if (normalized.id) {
      saveLocal(
        transactions.map((transaction) =>
          transaction.id === normalized.id ? { ...transaction, ...payload, id: transaction.id, sale_items: saleItems } : transaction
        )
      );
      return;
    }

    saveLocal([{ ...payload, id: crypto.randomUUID(), sale_items: saleItems }, ...transactions] as Transaction[]);
    return;
  }

  const upsertPayload = (normalized.id ? { ...payload, id: normalized.id } : payload) as Record<string, unknown>;
  const { data, error } = await supabase
    .from("transactions")
    .upsert(upsertPayload)
    .select("id")
    .single();

  if (error) throw error;

  if (normalized.type === "sale") {
    await supabase.from("sale_items").delete().eq("transaction_id", data.id);
    if (saleItems.length) {
      const rows = saleItems.map((item: SaleItem) => ({
        transaction_id: data.id,
        plant_name: item.plant_name,
        cost: Number(item.cost || 0),
        sale_price: Number(item.sale_price || 0)
      }));
      const { error: itemError } = await supabase.from("sale_items").insert(rows);
      if (itemError) throw itemError;
    }
  } else {
    await supabase.from("sale_items").delete().eq("transaction_id", data.id);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!supabase) {
    saveLocal(localTransactions().filter((transaction) => transaction.id !== id));
    return;
  }

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
