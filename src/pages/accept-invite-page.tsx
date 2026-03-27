import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { getInvitationByToken, acceptInvitation } from "@/api/invitations";
import { upsertUserPreferences } from "@/api/user-preferences";
import { useAuthStore } from "@/store/auth-store";
import { useLedgerStore } from "@/store/ledger-store";
import { Loader2, CheckCircle2, XCircle, Mail, LogIn } from "lucide-react";
import { toast } from "sonner";
import { toUserError } from "@/lib/sanitize";
import type { LedgerInvitation } from "@/types";

function formatInviteDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle } = useAuthStore();
  const { setActiveLedger, setConfig } = useLedgerStore();
  const [invitation, setInvitation] = useState<
    (LedgerInvitation & { ledger_name: string }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInvitation = useCallback(async () => {
    if (!token) {
      setErrorMsg("Invalid invitation link");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getInvitationByToken(token);
      if (!data) {
        setErrorMsg("Invitation not found");
      } else if (data.invalidated_at) {
        setErrorMsg(
          `This invitation was invalidated on ${formatInviteDate(data.invalidated_at)}.`
        );
      } else if (data.accepted_at) {
        setErrorMsg("This invitation has already been used");
      } else if (new Date(data.expires_at) < new Date()) {
        setErrorMsg(
          `This invitation expired on ${formatInviteDate(data.expires_at)}.`
        );
      } else {
        setInvitation(data);
      }
    } catch {
      setErrorMsg("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Only fetch invitation details once authenticated
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchInvitation();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, fetchInvitation]);

  const handleSignIn = () => {
    // Redirect back to this invite page after OAuth
    signInWithGoogle(window.location.href);
  };

  const handleAccept = async () => {
    if (!token || !invitation) return;
    try {
      setAccepting(true);
      await acceptInvitation(token);
      setActiveLedger(invitation.ledger_id, "admin");
      setConfig(null);
      upsertUserPreferences({ last_ledger_id: invitation.ledger_id }).catch(
        () => {}
      );
      toast.success(`Joined "${invitation.ledger_name}" as admin`);
      navigate("/", { replace: true });
    } catch (err) {
      const message = toUserError(err);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;

  // Not authenticated — prompt sign-in
  if (!user) {
    return (
      <div className="screen-shell">
        <Card className="screen-card w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="mx-auto h-10 w-10 text-primary" />
            <p className="section-kicker">Shared Access</p>
            <CardTitle className="text-3xl">Ledger Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              You've been invited to join a ledger. Sign in to view and accept
              this invitation.
            </p>
            <Button className="w-full" size="lg" onClick={handleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen-shell">
      <Card className="screen-card w-full max-w-md">
        <CardHeader className="text-center">
          {errorMsg ? (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <CardTitle className="text-3xl">Invitation Error</CardTitle>
            </>
          ) : (
            <>
              <Mail className="mx-auto h-10 w-10 text-primary" />
              <p className="section-kicker">Shared Access</p>
              <CardTitle className="text-3xl">Ledger Invitation</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {errorMsg ? (
            <>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/ledgers")}
              >
                Go to My Ledgers
              </Button>
            </>
          ) : invitation ? (
            <>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {invitation.ledger_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  You've been invited to join this ledger as an admin.
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires{" "}
                  {new Date(invitation.expires_at).toLocaleDateString("en-PH")}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Accept Invitation
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/ledgers")}
              >
                Decline
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
