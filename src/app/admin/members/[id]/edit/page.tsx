import { notFound } from "next/navigation";

import { getMemberById } from "@/actions/member.actions";
import { PageHeader } from "@/components/common/PageHeader";
import { MemberForm } from "@/components/members/MemberForm";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await getMemberById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Member"
        description={`Update ${response.data.member.name}'s profile details.`}
      />
      <MemberForm mode="edit" member={response.data.member} />
    </div>
  );
}
