import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, ExternalLink, Filter, Inbox, Loader2 } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification
} from "../../services/notificationApi";

type FilterMode = "all" | "unread";

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function entityTone(entityType: string) {
  const styles: Record<string, string> = {
    project: "bg-blue-50 text-blue-700",
    task: "bg-emerald-50 text-emerald-700",
    issue: "bg-red-50 text-red-700"
  };
  return styles[entityType] ?? "bg-slate-100 text-slate-700";
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchNotifications(filter === "unread");
      setNotifications(payload.items);
      setUnreadCount(payload.unread_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filter]);

  const groupedNotifications = useMemo(() => notifications, [notifications]);

  const handleOpenNotification = async (notification: ApiNotification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
    await loadData();
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>Kustomisasi</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">Notifikasi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500 mt-1">Semua assignment project, task, dan issue yang masuk ke akun Anda.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          disabled={unreadCount === 0}
          className="inline-flex items-center px-3 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <CheckCheck className="w-4 h-4 mr-1.5" />
          Tandai Semua Dibaca
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Bell className="w-4 h-4" />
            <span>{unreadCount} belum dibaca</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterMode)}
              className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
            >
              <option value="all">Semua notifikasi</option>
              <option value="unread">Belum dibaca</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="p-8 flex items-center justify-center text-sm text-slate-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memuat notifikasi...
          </div>
        )}

        {!isLoading && error && <div className="p-4 text-sm text-red-700 bg-red-50">{error}</div>}

        {!isLoading && !error && groupedNotifications.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Belum ada notifikasi pada filter ini.</p>
          </div>
        )}

        {!isLoading && !error && groupedNotifications.length > 0 && (
          <div className="divide-y divide-slate-100">
            {groupedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-4 flex items-start gap-3 ${notification.is_read ? "bg-white" : "bg-indigo-50/50"}`}
              >
                <span
                  className={`mt-2 h-2.5 w-2.5 rounded-full shrink-0 ${
                    notification.is_read ? "bg-slate-300" : "bg-indigo-600"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 ${entityTone(notification.entity_type)}`}>
                      {notification.entity_type}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">{formatDateTime(notification.created_at)}</p>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => void markNotificationRead(notification.id).then(loadData)}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          <CheckCheck className="w-3.5 h-3.5 mr-1" />
                          Dibaca
                        </button>
                      )}
                      {notification.target_url && (
                        <button
                          type="button"
                          onClick={() => void handleOpenNotification(notification)}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Buka
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
