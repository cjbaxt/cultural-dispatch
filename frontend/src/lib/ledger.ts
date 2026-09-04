export interface LedgerEvent {
  id: string;
  date: string;
  title: string;
  venue_name: string;
  type: string;
}

const LEDGER_API_URL = "https://ledger.claireheaded.com/api/events?limit=500";
const LEDGER_EVENT_URL = (id: string) => `https://ledger.claireheaded.com?token=ohjill&event=${id}`;

let _cache: LedgerEvent[] | null = null;

export async function fetchLedgerEvents(): Promise<LedgerEvent[]> {
  if (_cache) return _cache;
  const res = await fetch(LEDGER_API_URL);
  if (!res.ok) throw new Error("Failed to fetch ledger events");
  const data = await res.json();
  // API may return { events: [...] } or a plain array
  _cache = Array.isArray(data) ? data : (data.events ?? data.data ?? []);
  return _cache!;
}

export function ledgerEventUrl(id: string): string {
  return LEDGER_EVENT_URL(id);
}
