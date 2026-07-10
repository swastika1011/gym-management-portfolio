import Link from "next/link";
import { UserPlus } from "lucide-react";

import { getMembers } from "@/actions/member.actions";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { MembersTable } from "@/components/members/MembersTable";
import { Button } from "@/components/ui/button";

export default async function MembersPage() {
  const response = await getMembers();
  const members = response.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Members"
        description="Manage all registered gym members."
        action={
          <Button
            render={<Link href="/admin/members/new" />}
            className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
          >
            <UserPlus className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Add Member
          </Button>
        }
      />

      <SectionCard title="Members List">
        {response.success ? (
          <MembersTable members={members} />
        ) : (
          <EmptyState
            title="Unable to load members"
            description={response.message}
          />
        )}
      </SectionCard>
    </div>
  );
}
