import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  createInvitation,
  extendInvitation,
  getActiveInvitations,
  invalidateInvitation,
} from "@/api/invitations";
import { useLedgerMembers } from "@/hooks/use-ledger-members";
import {
  Loader2,
  Link2,
  Copy,
  Check,
  Trash2,
  Users,
  XCircle,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { addDays, format, formatDistanceToNow } from "date-fns";
import type { LedgerInvitation } from "@/types";

interface AdminManagementProps {
  ledgerId: string;
  isOwner: boolean;
}

export function AdminManagement({ ledgerId, isOwner }: AdminManagementProps) {
  const { members, loading, remove } = useLedgerMembers(ledgerId);
  const [activeInvitations, setActiveInvitations] = useState<LedgerInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedInvitationId, setCopiedInvitationId] = useState<string | null>(null);
  const [inviteActionId, setInviteActionId] = useState<string | null>(null);
  const [removeMember, setRemoveMember] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [invalidateTarget, setInvalidateTarget] = useState<LedgerInvitation | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoadingInvites(true);
      const invites = await getActiveInvitations(ledgerId);
      setActiveInvitations(invites);
    } catch {
      toast.error("Failed to load invite links");
    } finally {
      setLoadingInvites(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    if (isOwner) {
      fetchInvitations();
    }
  }, [isOwner, fetchInvitations]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const invitation = await createInvitation(ledgerId);
      setActiveInvitations((current) => [invitation, ...current]);
      toast.success("Invite link generated");
    } catch {
      toast.error("Failed to generate invite link");
    } finally {
      setGenerating(false);
    }
  };

  const handleExtend = async (invitation: LedgerInvitation) => {
    try {
      setInviteActionId(invitation.id);
      const baseDate = new Date(invitation.expires_at);
      const nextExpiry = addDays(
        baseDate > new Date() ? baseDate : new Date(),
        3
      );
      const updated = await extendInvitation(
        invitation.id,
        ledgerId,
        nextExpiry.toISOString()
      );
      setActiveInvitations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success("Invite link extended by 3 days");
    } catch {
      toast.error("Failed to extend invite link");
    } finally {
      setInviteActionId(null);
    }
  };

  const handleInvalidate = async () => {
    if (!invalidateTarget) return;
    try {
      setInviteActionId(invalidateTarget.id);
      await invalidateInvitation(invalidateTarget.id, ledgerId);
      setActiveInvitations((current) =>
        current.filter((item) => item.id !== invalidateTarget.id)
      );
      toast.success("Invite link invalidated");
    } catch {
      toast.error("Failed to invalidate link");
    } finally {
      setInviteActionId(null);
      setInvalidateTarget(null);
    }
  };

  const getInviteLink = (invitation: LedgerInvitation) =>
    `${window.location.origin}/invite/${invitation.token}`;

  const handleCopy = async (invitation: LedgerInvitation) => {
    try {
      await navigator.clipboard.writeText(getInviteLink(invitation));
      setCopiedInvitationId(invitation.id);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedInvitationId((current) => (
        current === invitation.id ? null : current
      )), 2000);
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
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Active Invite Links</p>
                  <p className="text-xs text-muted-foreground">
                    Links expire after 3 days and become unusable after one successful join.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-1 h-4 w-4" />
                  )}
                  New Link
                </Button>
              </div>

              {loadingInvites ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {activeInvitations.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-white/8 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                      No active invite links right now.
                    </div>
                  ) : (
                    activeInvitations.map((invitation, index) => {
                      const inviteLink = getInviteLink(invitation);
                      const isBusy = inviteActionId === invitation.id;
                      const isCopied = copiedInvitationId === invitation.id;

                      return (
                        <div
                          key={invitation.id}
                          className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">
                                Invite Link #{activeInvitations.length - index}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Created{" "}
                                {formatDistanceToNow(new Date(invitation.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-[rgba(168,213,186,0.12)] text-[var(--soft-mint)]">
                              Active
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={inviteLink}
                              className="h-10 text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="shrink-0"
                              onClick={() => handleCopy(invitation)}
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-3 py-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              Expires{" "}
                              {format(new Date(invitation.expires_at), "MMM d, yyyy h:mm a")}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-3 py-1">
                              {formatDistanceToNow(new Date(invitation.expires_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={isBusy}
                              onClick={() => handleExtend(invitation)}
                            >
                              {isBusy ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                              )}
                              Extend 3 Days
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-destructive hover:text-destructive"
                              disabled={isBusy}
                              onClick={() => setInvalidateTarget(invitation)}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              Invalidate
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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

      <ConfirmDialog
        open={!!invalidateTarget}
        onOpenChange={(open) => {
          if (!open) setInvalidateTarget(null);
        }}
        title="Invalidate Invite Link?"
        description="Anyone opening this link afterward will see that it has already been invalidated."
        onConfirm={handleInvalidate}
        confirmLabel="Invalidate"
        destructive
      />
    </>
  );
}
