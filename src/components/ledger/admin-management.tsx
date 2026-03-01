import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { createInvitation } from "@/api/invitations";
import { useLedgerMembers } from "@/hooks/use-ledger-members";
import { Loader2, UserPlus, Copy, Check, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface AdminManagementProps {
  ledgerId: string;
  isOwner: boolean;
}

export function AdminManagement({ ledgerId, isOwner }: AdminManagementProps) {
  const { members, loading, remove } = useLedgerMembers(ledgerId);
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeMember, setRemoveMember] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setInviting(true);
      const invitation = await createInvitation(ledgerId, trimmed);
      const link = `${window.location.origin}/invite/${invitation.token}`;
      setInviteLink(link);
      setEmail("");
      toast.success("Invitation created");
    } catch {
      toast.error("Failed to create invitation");
    } finally {
      setInviting(false);
    }
  };

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
            <>
              <div className="space-y-2 pt-2">
                <Label htmlFor="invite-email">Invite Admin</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInvite();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleInvite}
                    disabled={inviting}
                    className="shrink-0"
                  >
                    {inviting ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-1 h-4 w-4" />
                    )}
                    Invite
                  </Button>
                </div>
              </div>

              {inviteLink && (
                <div className="space-y-1.5 rounded-md border bg-muted/50 p-2">
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
                  <p className="text-xs text-muted-foreground">
                    One-time use. Expires in 7 days.
                  </p>
                </div>
              )}
            </>
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
