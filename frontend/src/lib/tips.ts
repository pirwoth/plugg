// Lightweight client-side persistence for simulated tips.
// Once Lovable Cloud is wired up this can be swapped for a real DB table.

export type Provider = "mtn" | "airtel";

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  coins: number; // 1 coin = 100 UGX in this simulation
}

export interface TipRecord {
  id: string;
  artistName: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  coins: number;
  amountUGX: number;
  fromName: string;
  fromPhone: string;
  provider: Provider;
  status: "success" | "failed";
  createdAt: number; // epoch ms
}

export const COIN_TO_UGX = 100;

export const GIFTS: Gift[] = [
  { id: "rose", name: "Rose", emoji: "🌹", coins: 1 },
  { id: "heart", name: "Heart", emoji: "❤️", coins: 5 },
  { id: "fire", name: "Fire", emoji: "🔥", coins: 10 },
  { id: "star", name: "Star", emoji: "⭐", coins: 25 },
  { id: "diamond", name: "Diamond", emoji: "💎", coins: 50 },
  { id: "crown", name: "Crown", emoji: "👑", coins: 100 },
  { id: "rocket", name: "Rocket", emoji: "🚀", coins: 250 },
  { id: "trophy", name: "Trophy", emoji: "🏆", coins: 500 },
  { id: "lion", name: "Lion King", emoji: "🦁", coins: 1000 },
  { id: "castle", name: "Castle", emoji: "🏰", coins: 2500 },
];

const STORAGE_KEY = "plugg.tips.v1";

function read(): TipRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(records: TipRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("plugg:tips-updated"));
  } catch {
    // noop
  }
}

export function detectProvider(phone: string): Provider | null {
  // Uganda prefixes (simplified): MTN 077/078/076/039, Airtel 070/074/075/020
  const digits = phone.replace(/\D/g, "");
  // normalize +256 / 256 prefix
  const local = digits.startsWith("256") ? "0" + digits.slice(3) : digits;
  const prefix = local.slice(0, 3);
  if (["077", "078", "076", "039"].includes(prefix)) return "mtn";
  if (["070", "074", "075", "020"].includes(prefix)) return "airtel";
  return null;
}

// Simulated MTN / Airtel mobile money APIs ------------------------------------

export interface InitiateResponse {
  transactionId: string;
  provider: Provider;
  status: "pending";
  message: string;
}

export interface ConfirmResponse {
  transactionId: string;
  status: "success" | "failed";
  reference: string;
  message: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function initiateMomo(params: {
  provider: Provider;
  phone: string;
  amountUGX: number;
}): Promise<InitiateResponse> {
  await sleep(900);
  const transactionId =
    (params.provider === "mtn" ? "MTN-" : "AIR-") +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    transactionId,
    provider: params.provider,
    status: "pending",
    message:
      params.provider === "mtn"
        ? `Dial *165# or approve the prompt sent to ${params.phone} to pay UGX ${params.amountUGX.toLocaleString()}.`
        : `Approve the Airtel Money prompt sent to ${params.phone} for UGX ${params.amountUGX.toLocaleString()}.`,
  };
}

export async function confirmMomo(transactionId: string): Promise<ConfirmResponse> {
  await sleep(1200);
  // 90% simulated success rate for realism
  const ok = Math.random() < 0.9;
  return {
    transactionId,
    status: ok ? "success" : "failed",
    reference: transactionId,
    message: ok ? "Payment received." : "Payment was cancelled or timed out.",
  };
}

// Tip records ----------------------------------------------------------------

export function getTipsForArtist(artistName: string): TipRecord[] {
  return read()
    .filter((t) => t.artistName === artistName && t.status === "success")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function recordTip(record: Omit<TipRecord, "id" | "createdAt">): TipRecord {
  const full: TipRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const all = read();
  all.push(full);
  write(all);
  return full;
}

export function subscribeTips(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("plugg:tips-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("plugg:tips-updated", handler);
    window.removeEventListener("storage", handler);
  };
}
