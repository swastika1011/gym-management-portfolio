"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteMember } from "@/actions/member.actions";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";

export interface MemberDeleteButtonProps {
  memberId: string;
  memberName: string;
  redirectTo?: string;
}

export function MemberDeleteButton({
  memberId,
  memberName,
  redirectTo = "/admin/members",
}: MemberDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleConfirm() {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await deleteMember(memberId);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      setIsDialogOpen(false);
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete member."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ConfirmDeleteDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      title="Delete member?"
      description={`This will permanently delete ${memberName}, including payment and attendance records.`}
      confirmText={isDeleting ? "Deleting..." : "Delete"}
      cancelText="Cancel"
      isConfirming={isDeleting}
      trigger={
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="rounded-xl text-[14px] font-semibold"
          disabled={isDeleting}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Delete
        </Button>
      }
      onConfirm={handleConfirm}
    />
  );
}
