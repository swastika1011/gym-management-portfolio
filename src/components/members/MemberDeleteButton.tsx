"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

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
  const [isPending, startTransition] = useTransition();

  return (
    <ConfirmDeleteDialog
      title="Delete member?"
      description={`This will permanently delete ${memberName}, including payment and attendance records.`}
      confirmText={isPending ? "Deleting..." : "Delete"}
      cancelText="Cancel"
      trigger={
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="rounded-xl text-[14px] font-semibold"
          disabled={isPending}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Delete
        </Button>
      }
      onConfirm={() => {
        startTransition(async () => {
          const response = await deleteMember(memberId);

          if (response.success) {
            router.push(redirectTo);
            router.refresh();
          }
        });
      }}
    />
  );
}
