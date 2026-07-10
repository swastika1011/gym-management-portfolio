import { PageHeader } from "@/components/common/PageHeader";
import { MemberForm } from "@/components/members/MemberForm";

export default function NewMemberPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Add Member"
        description="Create a new gym member profile."
      />
      <MemberForm mode="create" />
    </div>
  );
}
