export interface LedgerEvent {
  id: string;
  date: string;
  title: string;
  venue_name: string;
  type: string;
}

const LEDGER_EVENTS_URL = "https://cjbaxt.github.io/events-ledger/data/events.json";
const LEDGER_EVENT_URL = (id: string) => `https://cjbaxt.github.io/events-ledger/events/${id}`;

let _cache: LedgerEvent[] | null = null;

export async function fetchLedgerEvents(): Promise<LedgerEvent[]> {
  if (_cache) return _cache;
  const res = await fetch(LEDGER_EVENTS_URL);
  if (!res.ok) throw new Error("Failed to fetch ledger events");
  _cache = await res.json();
  return _cache!;
}

export function ledgerEventUrl(id: string): string {
  return LEDGER_EVENT_URL(id);
}
