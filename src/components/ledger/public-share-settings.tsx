import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Globe2, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { toUserError } from "@/lib/sanitize";
import {
  createLedgerPublicShare,
  getLedgerPublicShare,
  updateLedgerPublicShare,
} from "@/api/public-share";
import type { LedgerPublicShare, PublicBalanceAccessMode } from "@/types";

interface PublicShareSettingsProps {
  ledgerId: string;
  canManage: boolean;
}

function parseEmails(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function PublicShareSettings({
  ledgerId,
  canManage,
}: PublicShareSettingsProps) {
  const [share, setShare] = useState<LedgerPublicShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accessMode, setAccessMode] = useState<PublicBalanceAccessMode>("private");
  const [allowedEmailsInput, setAllowedEmailsInput] = useState("");

  const loadShare = useCallback(async () => {
    if (!canManage) return;
    try {
      setLoading(true);
      const data = await getLedgerPublicShare(ledgerId);
      setShare(data);
      setAccessMode(data?.access_mode ?? "private");
      setAllowedEmailsInput(data?.allowed_emails.join("\n") ?? "");
    } catch {
      toast.error("Failed to load public balance link");
    } finally {
      setLoading(false);
    }
  }, [canManage, ledgerId]);

  useEffect(() => {
    loadShare();
  }, [loadShare]);

  const shareUrl = share ? `${window.location.origin}/share/${share.token}` : null;
  const normalizedEmails = useMemo(
    () => parseEmails(allowedEmailsInput).map((entry) => entry.toLowerCase()),
    [allowedEmailsInput]
  );

  const hasChanges =
    !!share &&
    (share.access_mode !== accessMode ||
      share.allowed_emails.join("\n") !== normalizedEmails.join("\n"));

  if (!canManage) return null;

  const handleCreate = async () => {
    try {
      setCreating(true);
      const created = await createLedgerPublicShare(ledgerId);
      setShare(created);
      setAccessMode(created.access_mode);
      setAllowedEmailsInput(created.allowed_emails.join("\n"));
      toast.success("Public balance link created");
    } catch (err) {
      toast.error(toUserError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!share) return;

    if (accessMode === "restricted" && normalizedEmails.length === 0) {
      toast.error("Add at least one permitted email");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateLedgerPublicShare(share.id, ledgerId, {
        access_mode: accessMode,
        allowed_emails: accessMode === "restricted" ? normalizedEmails : [],
      });
      setShare(updated);
      setAccessMode(updated.access_mode);
      setAllowedEmailsInput(updated.allowed_emails.join("\n"));
      toast.success("Public balance access updated");
    } catch (err) {
      toast.error(toUserError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Public link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy public link");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Globe2 className="h-4 w-4" />
          Public Balance Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Create a read-only share link so members can view balances and download reports without editing anything.
        </p>
        <p className="text-xs text-muted-foreground">
          Access changes apply live. Restricted access requires the viewer to sign in with an allowed email address.
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !share ? (
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe2 className="mr-2 h-4 w-4" />
            )}
            Create Public Link
          </Button>
        ) : (
          <>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">Public URL</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{shareUrl}</p>
                </div>
                <Badge variant="secondary">
                  {share.access_mode === "anyone"
                    ? "Anyone with link"
                    : share.access_mode === "restricted"
                      ? "Restricted"
                      : "Private"}
                </Badge>
              </div>

              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="public-access-mode">Access Mode</Label>
              <Select
                value={accessMode}
                onValueChange={(value) => setAccessMode(value as PublicBalanceAccessMode)}
              >
                <SelectTrigger id="public-access-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </span>
                  </SelectItem>
                  <SelectItem value="anyone">
                    <span className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4" />
                      Anyone with the link
                    </span>
                  </SelectItem>
                  <SelectItem value="restricted">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Specific emails only
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessMode === "restricted" && (
              <div className="space-y-2">
                <Label htmlFor="allowed-emails">Allowed Emails</Label>
                <Textarea
                  id="allowed-emails"
                  value={allowedEmailsInput}
                  onChange={(e) => setAllowedEmailsInput(e.target.value)}
                  placeholder={"person@example.com\nsecond@example.com"}
                  className="min-h-28"
                />
                <p className="text-xs text-muted-foreground">
                  Add one email per line or separate them with commas. Only signed-in users on this list can open the link.
                </p>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe2 className="mr-2 h-4 w-4" />
              )}
              Save Public Access
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
