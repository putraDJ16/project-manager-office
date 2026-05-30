import { useEffect, useMemo, useState } from "react";
import { listEmailOutbox, resendEmail, type EmailOutboxItem } from "../../services/adminEmailApi";
import { PaginationControls } from "../../components/ui";

const PAGE_SIZE = 10;

export function EmailOutboxPage() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<EmailOutboxItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const load = () => listEmailOutbox(status || undefined).then((data) => setItems(data.items)).catch((error) => setMessage(error instanceof Error ? error.message : "Gagal memuat email log."));
  useEffect(() => { load(); }, [status]);
  useEffect(() => { setPage(1); }, [status, items.length]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Email Log</h1>
        <p className="mt-2 text-sm text-slate-600">Pantau outbox, status retry, dan kirim ulang email gagal.</p>
      </div>
      {message ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div> : null}
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm">
        <option value="">Semua status</option><option value="Queued">Queued</option><option value="Sent">Sent</option><option value="Failed">Failed</option>
      </select>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.to_email}</td><td className="px-4 py-3">{item.event_key}</td><td className="px-4 py-3">{item.subject}</td><td className="px-4 py-3">{item.status} ({item.attempts})</td><td className="px-4 py-3"><button className="rounded-xl border border-color-border bg-color-card px-3 py-1 text-color-foreground transition-colors hover:bg-color-secondary" onClick={() => resendEmail(item.id).then(load)}>Resend</button></td></tr>)}
          </tbody>
        </table>
        <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={items.length} onPageChange={setPage} className="border-t border-slate-200" />
      </div>
    </section>
  );
}
