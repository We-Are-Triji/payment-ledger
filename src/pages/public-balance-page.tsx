import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { UserAvatar } from "@/components/users/user-avatar";
import { useAuthStore } from "@/store/auth-store";
import { getPublicBalanceSnapshot } from "@/api/public-share";
import {
  exportBulkBalanceCSV,
  exportBulkBalancePDF,
  exportSingleBalanceCSV,
  exportSingleBalancePDF,
} from "@/lib/export-balance";
import {
  calculateGlobalSummary,
  calculateStudentBalance,
  calculateStudentStatus,
  getValidClassDays,
} from "@/lib/ledger-math";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Lock, LogIn } from "lucide-react";
import { toUserError } from "@/lib/sanitize";
import type { PublicBalanceSnapshot, StudentWithBalance } from "@/types";

const REFRESH_MS = 5_000;

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
  const studentsWithBalance = snapshot.students
    .map((student) => {
      const totalPaid = Number(snapshot.payment_totals[student.id] || 0);
      return {
        ...student,
        totalPaid,
        balance: calculateStudentBalance(totalPaid, totalExpected),
        status: calculateStudentStatus(totalPaid, totalExpected),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    depositAmount,
    totalExpected,
    studentsWithBalance,
    summary: calculateGlobalSummary(
      studentsWithBalance.map((student) => ({ totalPaid: student.totalPaid })),
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const loadSnapshot = useCallback(async (options?: { silent?: boolean }) => {
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
      setSelectedStudentId(null);
      setError(toUserError(err));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [token]);

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
        totalExpected: 0,
        studentsWithBalance: [] as StudentWithBalance[],
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

  const selectedStudent = useMemo(
    () =>
      derived.studentsWithBalance.find((student) => student.id === selectedStudentId) ?? null,
    [derived.studentsWithBalance, selectedStudentId]
  );
  const { summary } = derived;

  const handleDownload = useCallback(
    async (
      action: (data: ReturnType<typeof buildPublicBalanceData>, freshSnapshot: PublicBalanceSnapshot) => void
    ) => {
      if (!token) return;

      try {
        const freshSnapshot = await getPublicBalanceSnapshot(token);
        setSnapshot(freshSnapshot);
        setError(null);
        action(buildPublicBalanceData(freshSnapshot), freshSnapshot);
      } catch (err) {
        setSnapshot(null);
        setSelectedStudentId(null);
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
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
            <p className="section-kicker">Read Only</p>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              {snapshot.ledger_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="soft-subpanel rounded-[22px] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Collected</p>
                <p className="mt-1.5 text-base font-bold text-[var(--soft-mint)]">
                  {formatCurrency(summary.totalCollected)}
                </p>
              </div>
              <div className="soft-subpanel rounded-[22px] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Expected</p>
                <p className="mt-1.5 text-base font-bold text-[var(--soft-blue)]">
                  {formatCurrency(summary.globalExpected)}
                </p>
              </div>
              <div className="soft-subpanel rounded-[22px] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Goal</p>
                <p className="mt-1.5 text-base font-bold text-[var(--soft-gold)]">
                  {formatCurrency(snapshot.payment_goal)}
                </p>
              </div>
              <div className="soft-subpanel rounded-[22px] p-3.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Members</p>
                <p className="mt-1.5 text-base font-bold text-white">
                  {derived.studentsWithBalance.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() =>
                  handleDownload((data, freshSnapshot) =>
                    exportBulkBalanceCSV(
                      data.studentsWithBalance,
                      freshSnapshot.ledger_name,
                      data.totalExpected,
                      data.depositAmount
                    )
                  )
                }
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Class CSV
              </Button>
              <Button
                onClick={() =>
                  handleDownload((data, freshSnapshot) =>
                    exportBulkBalancePDF(
                      data.studentsWithBalance,
                      freshSnapshot.ledger_name,
                      data.totalExpected,
                      data.depositAmount
                    )
                  )
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Class PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {derived.studentsWithBalance.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedStudentId(student.id)}
              className="soft-panel flex w-full items-center gap-3 rounded-[24px] p-4 text-left transition hover:bg-white/[0.05]"
            >
              <UserAvatar
                name={student.name}
                avatarUrl={student.avatar_url}
                className="h-11 w-11"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">{student.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Balance
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-base font-bold ${
                    student.balance >= 0
                      ? "text-[var(--soft-mint)]"
                      : "text-[var(--soft-peach)]"
                  }`}
                >
                  {formatCurrency(student.balance)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tap for downloads
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedStudent.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="soft-subpanel rounded-[22px] p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Paid</p>
                    <p className="mt-1.5 text-base font-bold text-[var(--soft-mint)]">
                      {formatCurrency(selectedStudent.totalPaid)}
                    </p>
                  </div>
                  <div className="soft-subpanel rounded-[22px] p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Balance</p>
                    <p className="mt-1.5 text-base font-bold text-[var(--soft-peach)]">
                      {formatCurrency(selectedStudent.balance)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDownload((data, freshSnapshot) => {
                        const freshStudent = data.studentsWithBalance.find(
                          (student) => student.id === selectedStudent.id
                        );
                        if (!freshStudent) {
                          throw new Error("Member record is no longer available");
                        }
                        exportSingleBalanceCSV(
                          freshStudent,
                          freshSnapshot.ledger_name,
                          data.totalExpected,
                          data.depositAmount
                        );
                      })
                    }
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    onClick={() =>
                      handleDownload((data, freshSnapshot) => {
                        const freshStudent = data.studentsWithBalance.find(
                          (student) => student.id === selectedStudent.id
                        );
                        if (!freshStudent) {
                          throw new Error("Member record is no longer available");
                        }
                        exportSingleBalancePDF(
                          freshStudent,
                          freshSnapshot.ledger_name,
                          data.totalExpected,
                          data.depositAmount
                        );
                      })
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
