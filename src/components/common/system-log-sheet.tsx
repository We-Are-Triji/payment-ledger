import { useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Banknote, UserRound, Settings, CalendarDays, Archive, Download, Share2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useLedgerStore } from "@/store/ledger-store";
import { useAuditLog } from "@/hooks/use-audit-log";
import { exportAuditLogToCSV, exportAuditLogToPDF } from "@/lib/export";
import { format, isToday, isYesterday } from "date-fns";
import noSignalSvg from "@/assets/illustrations/no-signal.svg";
import type { AuditLogEntry } from "@/types";

interface SystemLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_CATEGORIES = [
  { value: "all", label: "All Events" },
  { value: "payment", label: "Payments" },
  { value: "contributor", label: "Contributors" },
  { value: "config", label: "Settings" },
  { value: "calendar", label: "Calendar" },
  { value: "backup", label: "Backups" },
  { value: "member", label: "Team" },
];

function getEventIcon(eventType: string) {
  const prefix = eventType.split(".")[0];
  switch (prefix) {
    case "payment": return Banknote;
    case "contributor": return UserRound;
    case "config": return Settings;
    case "calendar": return CalendarDays;
    case "backup": return Archive;
    case "member": return UserPlus;
    default: return Settings;
  }
}

function getActionBadge(eventType: string) {
  const action = eventType.split(".")[1];
  switch (action) {
    case "create": return { label: "Created", variant: "default" as const };
    case "update": return { label: "Updated", variant: "secondary" as const };
    case "delete": return { label: "Deleted", variant: "destructive" as const };
    case "void": return { label: "Voided", variant: "destructive" as const };
    case "upsert": return { label: "Set", variant: "default" as const };
    case "restore": return { label: "Restored", variant: "secondary" as const };
    case "invite": return { label: "Invited", variant: "default" as const };
    case "accept": return { label: "Accepted", variant: "default" as const };
    case "remove": return { label: "Removed", variant: "destructive" as const };
    default: return { label: action, variant: "secondary" as const };
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return format(date, "h:mm a");
}

function groupByDate(entries: AuditLogEntry[]): [string, AuditLogEntry[]][] {
  const groups: Record<string, AuditLogEntry[]> = {};
  for (const entry of entries) {
    const date = new Date(entry.created_at);
    let label: string;
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else label = format(date, "MMM d, yyyy");

    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }
  return Object.entries(groups);
}

function AuditLogItem({ entry }: { entry: AuditLogEntry }) {
  const Icon = getEventIcon(entry.event_type);
  const badge = getActionBadge(entry.event_type);

  return (
    <div className="flex items-start gap-3 rounded-lg p-2 text-sm">
      <div className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="leading-snug">{entry.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {entry.actor_email && (
            <span className="mr-1.5">{entry.actor_email} &middot;</span>
          )}
          {formatRelativeTime(entry.created_at)}
        </p>
      </div>
      <Badge variant={badge.variant} className="shrink-0 text-[10px] px-1.5 py-0">
        {badge.label}
      </Badge>
    </div>
  );
}

export function SystemLogSheet({ open, onOpenChange }: SystemLogSheetProps) {
  const config = useLedgerStore((s) => s.config);
  const { entries, loading, hasMore, page, nextPage, prevPage, eventFilter, setEventFilter, refetch } =
    useAuditLog(config?.id);

  useEffect(() => {
    if (!open) return;
    refetch();
  }, [open, refetch]);

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  const handleExportCSV = () => {
    if (config) exportAuditLogToCSV(entries, config.name);
  };

  const handleExportPDF = () => {
    if (config) exportAuditLogToPDF(entries, config.name);
  };

  const handleShare = async () => {
    if (!config || !navigator.share) return;
    const rows = entries.map((e) => ({
      Timestamp: new Date(e.created_at).toLocaleString("en-PH"),
      Event: e.event_type,
      Description: e.description,
    }));

    const { default: Papa } = await import("papaparse");
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const file = new File([blob], `${config.name}-audit-log.csv`, { type: "text/csv" });
    try {
      await navigator.share({ title: "System Log", files: [file] });
    } catch {
      // User cancelled share
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>System Log</SheetTitle>
          <SheetDescription>
            {entries.length} entries · 90-day retention
          </SheetDescription>
        </SheetHeader>

        <div className="px-1">
          <Select
            value={eventFilter ?? "all"}
            onValueChange={(v) => setEventFilter(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent position="popper">
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-1">
          {entries.length === 0 && !loading && (
            <div className="flex flex-col items-center py-12 text-center">
              <img src={noSignalSvg} alt="" className="mb-3 h-24 w-24 opacity-60" />
              <p className="text-sm text-muted-foreground">
                No log entries yet.
              </p>
            </div>
          )}
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="sticky top-0 z-10 bg-background text-xs font-medium text-muted-foreground py-1 px-2">
                {date}
              </p>
              <div className="space-y-0.5">
                {items.map((entry) => (
                  <AuditLogItem key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
          {(page > 0 || hasMore) && (
            <div className="flex items-center justify-between py-2 px-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevPage}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Newer
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={!hasMore || loading}
              >
                Older
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
          {loading && entries.length === 0 && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-row">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleExportCSV}>
            <Download className="mr-1 h-3.5 w-3.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handleExportPDF}>
            <Download className="mr-1 h-3.5 w-3.5" />
            PDF
          </Button>
          {"share" in navigator && (
            <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
              <Share2 className="mr-1 h-3.5 w-3.5" />
              Share
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
