// src/pages/Notifications.jsx
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { Bell, Trash2, CheckCircle2 } from "lucide-react";

import useNotificationSettings from "@/hooks/useNotificationSettings";
import useNotifications from "@/hooks/useNotifications";

function fmtDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d ? d.toLocaleString() : "";
  } catch {
    return "";
  }
}

export default function Notifications() {
  const { user } = useAuth();

  const uid = user?.uid || null;

  const {
    settings,
    setEmailEnabled,
    setPushEnabled,
    // optional advanced toggles if you built them
    setLowStockEmail,
    setIncidentEmail,
  } = useNotificationSettings(uid);

  const { rows, unreadCount, markRead, clearAll, loading } = useNotifications(uid);

  const feedEmpty = !loading && (!rows || rows.length === 0);

  const canShow = !!uid;

  const showLowStockToggle = typeof settings?.lowStockEmail === "boolean";
  const showIncidentToggle = typeof settings?.incidentEmail === "boolean";

  const title = useMemo(() => `Notifications`, []);

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-900/70 text-teal-300 flex items-center justify-center shadow-sm border border-slate-800/60">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-50">{title}</div>
              <div className="text-slate-300/80 -mt-0.5">Per-user notification settings and your personal feed.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-700/70 text-slate-200">
              Unread: {unreadCount || 0}
            </Badge>

            <Button
              variant="outline"
              className="rounded-full border-slate-700/70 bg-slate-900/40 text-slate-200 hover:bg-slate-900/60"
              onClick={clearAll}
              disabled={!canShow || (rows?.length || 0) === 0}
              title={!canShow ? "Sign in to view notifications" : ""}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Settings */}
        <Card className="rounded-2xl border border-slate-800/70 bg-slate-900/60 text-slate-100 backdrop-blur">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription className="text-slate-300/80">
              These preferences are stored per user and saved automatically.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div>
                <div className="font-semibold text-slate-50">Email alerts</div>
                <div className="text-xs text-slate-400 mt-0.5">Low stock + important events via email</div>
              </div>
              <Checkbox
                checked={!!settings?.emailEnabled}
                onCheckedChange={(v) => setEmailEnabled(!!v)}
                disabled={!canShow}
              />
            </div>

            {showLowStockToggle && (
              <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
                <div>
                  <div className="font-semibold text-slate-50">Low stock emails</div>
                  <div className="text-xs text-slate-400 mt-0.5">Send email when items fall below minimum</div>
                </div>
                <Checkbox
                  checked={!!settings?.lowStockEmail}
                  onCheckedChange={(v) => setLowStockEmail?.(!!v)}
                  disabled={!canShow || !settings?.emailEnabled}
                />
              </div>
            )}

            {showIncidentToggle && (
              <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
                <div>
                  <div className="font-semibold text-slate-50">Incident emails</div>
                  <div className="text-xs text-slate-400 mt-0.5">Send email for temperature incidents</div>
                </div>
                <Checkbox
                  checked={!!settings?.incidentEmail}
                  onCheckedChange={(v) => setIncidentEmail?.(!!v)}
                  disabled={!canShow || !settings?.emailEnabled}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div>
                <div className="font-semibold text-slate-50">Push notifications</div>
                <div className="text-xs text-slate-400 mt-0.5">Future (requires device token)</div>
              </div>
              <Checkbox checked={!!settings?.pushEnabled} onCheckedChange={(v) => setPushEnabled(!!v)} disabled={!canShow} />
            </div>

            <div className="text-xs text-slate-400">Changes save automatically.</div>
          </CardContent>
        </Card>

        {/* Feed */}
        <Card className="rounded-2xl border border-slate-800/70 bg-slate-900/60 text-slate-100 backdrop-blur">
          <CardHeader>
            <CardTitle>Your feed</CardTitle>
            <CardDescription className="text-slate-300/80">
              Personal notifications appear here (only you can see them).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Separator className="bg-slate-800/70 mb-4" />

            {!canShow && (
              <div className="h-40 rounded-xl bg-slate-950/40 border border-slate-800/70 flex items-center justify-center text-slate-400">
                Sign in to view your feed.
              </div>
            )}

            {canShow && loading && (
              <div className="h-40 rounded-xl bg-slate-950/40 border border-slate-800/70 flex items-center justify-center text-slate-400">
                Loading notifications…
              </div>
            )}

            {canShow && feedEmpty && (
              <div className="h-40 rounded-xl bg-slate-950/40 border border-dashed border-slate-800/70 flex items-center justify-center text-slate-400">
                No notifications yet.
              </div>
            )}

            {canShow && !loading && rows?.length > 0 && (
              <div className="space-y-2">
                {rows.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl bg-slate-950/40 border border-slate-800/70 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-50 truncate">{n.title || "Notification"}</div>
                        {!n.read && (
                          <Badge className="bg-teal-500/15 text-teal-200 border border-teal-400/20" variant="outline">
                            Unread
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-300 mt-1">{n.message || "—"}</div>
                      <div className="text-xs text-slate-500 mt-2">{fmtDate(n.createdAt)}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!n.read && (
                        <Button
                          variant="outline"
                          className="rounded-full border-slate-700/70 bg-slate-900/40 text-slate-200 hover:bg-slate-900/60"
                          onClick={() => markRead(n.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


