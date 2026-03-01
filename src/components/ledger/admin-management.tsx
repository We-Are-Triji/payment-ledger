import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  createInvitation,
  getPendingInvitation,
  invalidateInvitation,
} from "@/api/invitations";
import { useLedgerMembers } from "@/hooks/use-ledger-members";
import { Loader2, Link2, Copy, Check, Trash2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { LedgerInvitation } from "@/types";

interface AdminManagementProps {
  ledgerId: string;
  isOwner: boolean;
}

export function AdminManagement({ ledgerId, isOwner }: AdminManagementProps) {
  const { members, loading, remove } = useLedgerMembers(ledgerId);
  const [pendingInvite, setPendingInvite] = useState<LedgerInvitation | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeMember, setRemoveMember] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setLoadingInvite(true);
      const invite = await getPendingInvitation(ledgerId);
      setPendingInvite(invite);
    } catch {
      // Silently fail — no pending invite
    } finally {
      setLoadingInvite(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    if (isOwner) {
      fetchPending();
    }
  }, [isOwner, fetchPending]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const invitation = await createInvitation(ledgerId);
      setPendingInvite(invitation);
      toast.success("Invite link generated");
    } catch {
      toast.error("Failed to generate invite link");
    } finally {
      setGenerating(false);
    }
  };

  const handleInvalidate = async () => {
    if (!pendingInvite) return;
    try {
      await invalidateInvitation(pendingInvite.id, ledgerId);
      setPendingInvite(null);
      toast.success("Invite link invalidated");
    } catch {
      toast.error("Failed to invalidate link");
    }
  };

  const inviteLink = pendingInvite
    ? `${window.location.origin}/invite/${pendingInvite.token}`
    : null;

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRemove = async () => {
    if (!removeMember) return;
    try {
      await remove(removeMember.id, { ledgerId, email: removeMember.email });
      toast.success(`Removed ${removeMember.email}`);
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoveMember(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        member.role === "owner" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {member.role === "owner" ? "Owner" : "Admin"}
                    </Badge>
                    {isOwner && member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          setRemoveMember({
                            id: member.id,
                            email: member.email,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOwner && (
            <div className="space-y-2 pt-2">
              {loadingInvite ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : pendingInvite && inviteLink ? (
                <div className="space-y-2 rounded-md border bg-muted/50 p-3">
                  <p className="text-xs font-medium">Active Invite Link</p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="h-8 text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      One-time use. Expires{" "}
                      {formatDistanceToNow(new Date(pendingInvite.expires_at), {
                        addSuffix: true,
                      })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={handleInvalidate}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Invalidate
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-1 h-4 w-4" />
                  )}
                  Generate Invite Link
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!removeMember}
        onOpenChange={(open) => {
          if (!open) setRemoveMember(null);
        }}
        title="Remove Admin?"
        description={`Remove ${removeMember?.email} from this ledger? They will lose all access.`}
        onConfirm={handleRemove}
        confirmLabel="Remove"
        destructive
      />
    </>
  );
}
