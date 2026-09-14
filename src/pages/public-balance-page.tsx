import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMonths,
  format,
  isBefore,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  ChevronDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Lock,
  LogIn,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { UserAvatar } from "@/components/users/user-avatar";
import {
  UserFilters,
  type SortOption,
  type StatusFilter,
} from "@/components/users/user-filters";
import { useAuthStore } from "@/store/auth-store";
import { getPublicBalanceSnapshot } from "@/api/public-share";
import {
  exportBulkBalanceCSV,
  exportBulkBalancePDF,
  exportSingleBalanceCSV,
  exportSingleBalancePDF,
} from "@/lib/export-balance";
import {
  buildDayCoverage,
  calculateGlobalSummary,
  calculateContributorBalance,
  calculateContributorStatus,
  getValidClassDays,
} from "@/lib/ledger-math";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { toUserError } from "@/lib/sanitize";
import type { PublicBalanceSnapshot, ContributorWithBalance } from "@/types";

const REFRESH_MS = 5_000;
const BALANCE_EXPLAINER_VIDEO_URL = "https://youtu.be/B4CZEqv8p88";

function buildPublicBalanceData(snapshot: PublicBalanceSnapshot) {
  const depositAmount = Number(snapshot.deposit_amount || 0);
  const paymentGoal = Number(snapshot.payment_goal || 0);
  const validClassDays = getValidClassDays(
    new Date(snapshot.start_date),
    new Date(),
    snapshot.week_filter,
    snapshot.overrides
  );
  const totalExpected = validClassDays.length * depositAmount;
  const contributorsWithBalance = snapshot.students
    .map((contributor) => {
      const totalPaid = Number(snapshot.payment_totals[contributor.id] || 0);
      return {
        ...contributor,
        totalPaid,
        balance: calculateContributorBalance(totalPaid, totalExpected),
        status: calculateContributorStatus(totalPaid, totalExpected),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    depositAmount,
    paymentGoal,
    totalExpected,
    validClassDays,
    contributorsWithBalance,
    summary: calculateGlobalSummary(
      contributorsWithBalance.map((contributor) => ({ totalPaid: contributor.totalPaid })),
      totalExpected,
      paymentGoal
    ),
  };
}

export default function PublicBalancePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle } = useAuthStore();
  const [snapshot, setSnapshot] = useState<PublicBalanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContributorId, setSelectedContributorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [classExportOpen, setClassExportOpen] = useState(false);

  const loadSnapshot = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token) {
        setError("Public balance link not found");
        setLoading(false);
        return;
      }

      try {
        if (!options?.silent) {
          setLoading(true);
        }
        const data = await getPublicBalanceSnapshot(token);
        setSnapshot(data);
        setError(null);
      } catch (err) {
        setSnapshot(null);
        setSelectedContributorId(null);
        setError(toUserError(err));
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    if (authLoading) return;
    loadSnapshot();
  }, [authLoading, loadSnapshot]);

  useEffect(() => {
    if (authLoading) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadSnapshot({ silent: true });
      }
    }, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [authLoading, loadSnapshot]);

  useEffect(() => {
    const handleFocus = () => {
      loadSnapshot({ silent: true });
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadSnapshot]);

  const derived = useMemo(() => {
    if (!snapshot) {
      return {
        depositAmount: 0,
        paymentGoal: 0,
        totalExpected: 0,
        validClassDays: [] as Date[],
        contributorsWithBalance: [] as ContributorWithBalance[],
        summary: {
          totalCollected: 0,
          globalExpected: 0,
          collectionRate: 0,
          goalProgress: 0,
          remaining: 0,
          paymentGoal: 0,
        },
      };
    }

    return buildPublicBalanceData(snapshot);
  }, [snapshot]);

  const filteredContributors = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    let result = [...derived.contributorsWithBalance];

    if (query) {
      result = result.filter((contributor) =>
        contributor.name.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((contributor) => contributor.status === statusFilter);
    }

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sort === "name-asc" ? cmp : -cmp;
    });

    return result;
  }, [deferredSearch, derived.contributorsWithBalance, sort, statusFilter]);

  const selectedContributor = useMemo(
    () =>
      derived.contributorsWithBalance.find((contributor) => contributor.id === selectedContributorId) ?? null,
    [derived.contributorsWithBalance, selectedContributorId]
  );

  const handleDownload = useCallback(
    async (
      action: (
        data: ReturnType<typeof buildPublicBalanceData>,
        freshSnapshot: PublicBalanceSnapshot
      ) => void
    ) => {
      if (!token) return;

      try {
        const freshSnapshot = await getPublicBalanceSnapshot(token);
        setSnapshot(freshSnapshot);
        setError(null);
        action(buildPublicBalanceData(freshSnapshot), freshSnapshot);
      } catch (err) {
        setSnapshot(null);
        setSelectedContributorId(null);
        setError(toUserError(err));
        toast.error(toUserError(err));
      }
    },
    [token]
  );

  const handleSignIn = async () => {
    try {
      await signInWithGoogle(window.location.href);
    } catch {
      toast.error("Failed to start sign in");
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner className="min-h-dvh" />;
  }

  if (error || !snapshot) {
    return (
      <div className="screen-shell">
        <Card className="screen-card w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-10 w-10 text-destructive" />
            <p className="section-kicker">Balance Link</p>
            <CardTitle className="text-3xl">Access Blocked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {error || "You are not permitted to view this balance link."}
            </p>
            {!user && (
              <Button className="w-full" onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="page-shell animate-page-enter">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="section-kicker">Read Only</p>
                <CardTitle className="truncate text-2xl font-bold tracking-tight text-white">
                  {snapshot.ledger_name}
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setClassExportOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Collected"
                value={formatCurrency(derived.summary.totalCollected)}
                tone="text-[var(--soft-mint)]"
              />
              <StatCard
                label="Expected"
                value={formatCurrency(derived.summary.globalExpected)}
                tone="text-[var(--soft-blue)]"
              />
              <StatCard
                label="Goal"
                value={formatCurrency(snapshot.payment_goal)}
                tone="text-[var(--soft-gold)]"
              />
              <StatCard
                label="Contributors"
                value={String(derived.contributorsWithBalance.length)}
                tone="text-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="space-y-2 rounded-[22px] border border-[rgba(251,228,161,0.32)] bg-[linear-gradient(145deg,rgba(251,228,161,0.98),rgba(219,191,106,0.9))] py-5 text-center shadow-[0_24px_52px_rgba(120,101,41,0.26)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#473907]">
              Balance Basis
            </p>
            <p className="text-sm font-medium text-[#4d3e0a]">
              Expected Payment By Now
            </p>
            <p className="text-4xl font-extrabold tracking-tight text-[#1f1a07] sm:text-5xl">
              {formatCurrency(derived.totalExpected)}
            </p>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="mx-auto w-full max-w-xl justify-center"
          onClick={() => window.open(BALANCE_EXPLAINER_VIDEO_URL, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          How is my balance calculated?
        </Button>

        <Card>
          <CardContent className="space-y-2.5 pt-3 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search contributor"
                className="h-10 rounded-[14px] pl-10 text-sm"
              />
            </div>

            <UserFilters
              statusFilter={statusFilter}
              sort={sort}
              onStatusFilterChange={setStatusFilter}
              onSortChange={setSort}
            />
          </CardContent>
        </Card>

        {filteredContributors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No contributors match the current search or filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredContributors.map((contributor) => (
              <button
                key={contributor.id}
                type="button"
                onClick={() => setSelectedContributorId(contributor.id)}
                className="soft-panel flex w-full items-center gap-3 rounded-[20px] p-4 text-left transition hover:bg-white/[0.05]"
              >
                <UserAvatar
                  name={contributor.name}
                  avatarUrl={contributor.avatar_url}
                  className="h-11 w-11"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">
                    {contributor.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Balance
                  </p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <p
                    className={`text-base font-bold ${
                      contributor.balance >= 0
                        ? "text-[var(--soft-mint)]"
                        : "text-[var(--soft-peach)]"
                    }`}
                  >
                    {formatCurrency(contributor.balance)}
                  </p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedContributor && (
        <PublicContributorDetailDialog
          open={!!selectedContributor}
          onOpenChange={(open) => {
            if (!open) setSelectedContributorId(null);
          }}
          contributor={selectedContributor}
          snapshot={snapshot}
          totalExpected={derived.totalExpected}
          validClassDays={derived.validClassDays}
          onCsv={() =>
            handleDownload((data, freshSnapshot) => {
              const freshContributor = data.contributorsWithBalance.find(
                (entry) => entry.id === selectedContributor.id
              );
              if (!freshContributor) {
                throw new Error("Contributor record is no longer available");
              }
              exportSingleBalanceCSV(
                freshContributor,
                freshSnapshot.ledger_name,
                data.totalExpected,
                data.depositAmount
              );
            })
          }
          onPdf={() =>
            handleDownload((data, freshSnapshot) => {
              const freshContributor = data.contributorsWithBalance.find(
                (entry) => entry.id === selectedContributor.id
              );
              if (!freshContributor) {
                throw new Error("Contributor record is no longer available");
              }
              exportSingleBalancePDF(
                freshContributor,
                freshSnapshot.ledger_name,
                data.totalExpected,
                data.depositAmount
              );
            })
          }
        />
      )}

      <Dialog open={classExportOpen} onOpenChange={setClassExportOpen}>
        <DialogContent className="z-[80] max-w-sm">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                handleDownload((data, freshSnapshot) =>
                  exportBulkBalanceCSV(
                    data.contributorsWithBalance,
                    freshSnapshot.ledger_name,
                    data.totalExpected,
                    data.depositAmount
                  )
                );
                setClassExportOpen(false);
              }}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              onClick={() => {
                handleDownload((data, freshSnapshot) =>
                  exportBulkBalancePDF(
                    data.contributorsWithBalance,
                    freshSnapshot.ledger_name,
                    data.totalExpected,
                    data.depositAmount
                  )
                );
                setClassExportOpen(false);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="soft-subpanel rounded-[16px] p-3.5">
      <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground/75">
        {label}
      </p>
      <p className={`mt-1.5 text-base font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ExportChooser({
  label,
  onCsv,
  onPdf,
}: {
  label: string;
  onCsv: () => void;
  onPdf: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-xs">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {label}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onCsv();
              setOpen(false);
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            className="w-full"
            onClick={() => {
              onPdf();
              setOpen(false);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PublicContributorDetailDialog({
  open,
  onOpenChange,
  contributor,
  snapshot,
  totalExpected,
  validClassDays,
  onCsv,
  onPdf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributor: ContributorWithBalance;
  snapshot: PublicBalanceSnapshot;
  totalExpected: number;
  validClassDays: Date[];
  onCsv: () => void;
  onPdf: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dayCoverage = useMemo(
    () =>
      buildDayCoverage(
        validClassDays,
        [{ id: contributor.id }],
        { [contributor.id]: contributor.totalPaid },
        Number(snapshot.deposit_amount || 0)
      ),
    [snapshot.deposit_amount, contributor.id, contributor.totalPaid, validClassDays]
  );

  const ledgerStartMonth = startOfMonth(new Date(snapshot.start_date));
  const canGoPrev = isBefore(ledgerStartMonth, startOfMonth(currentMonth));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contributor.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Paid"
              value={formatCurrency(contributor.totalPaid)}
              tone="text-[var(--soft-mint)]"
            />
            <StatCard
              label="Expected"
              value={formatCurrency(totalExpected)}
              tone="text-[var(--soft-blue)]"
            />
            <StatCard
              label="Balance"
              value={formatCurrency(contributor.balance)}
              tone={contributor.balance >= 0 ? "text-[var(--soft-mint)]" : "text-[var(--soft-peach)]"}
            />
          </div>

          <div className="flex justify-center">
            <ExportChooser label="Export Contributor Report" onCsv={onCsv} onPdf={onPdf} />
          </div>

          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!canGoPrev}
                  onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="section-kicker mb-1">Payment Calendar</p>
                  <CardTitle className="text-base font-semibold text-white">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <CalendarGrid
                currentMonth={currentMonth}
                weekFilter={snapshot.week_filter}
                overrides={snapshot.overrides}
                startDate={snapshot.start_date}
                dayCoverage={dayCoverage}
                totalContributors={1}
                interactive={false}
              />

              <div className="grid grid-cols-3 gap-2 text-center">
                <LegendChip label="Paid" tone="bg-[rgba(168,213,186,0.18)] text-[var(--soft-mint)]" />
                <LegendChip label="Not Paid" tone="bg-[rgba(255,181,167,0.16)] text-[var(--soft-peach)]" />
                <LegendChip label="Off Day" tone="bg-white/[0.06] text-white" />
              </div>

              <div className="soft-subpanel rounded-[16px] px-3.5 py-3 text-sm text-muted-foreground">
                This calendar uses the same balance rules as the main ledger. Green
                days are covered, red days are still unpaid, and off days are marked
                separately.
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LegendChip({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  return (
    <div className={`rounded-[14px] px-2.5 py-2 text-xs font-semibold ${tone}`}>
      {label}
    </div>
  );
}
