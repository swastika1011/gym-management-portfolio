"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";

import {
  createMember,
  type CreateMemberInput,
  type MemberData,
  updateMember,
} from "@/actions/member.actions";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MemberCategory = "Male" | "Female" | "Student";

export interface MemberFormProps {
  mode: "create" | "edit";
  member?: MemberData;
}

type FormErrors = Partial<Record<keyof CreateMemberInput, string>>;

function dateInputValue(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

function validate(values: CreateMemberInput) {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!/^[0-9]{10}$/.test(values.mobileNumber.trim())) {
    errors.mobileNumber = "Enter a valid 10 digit mobile number.";
  }

  if (!["Male", "Female", "Student"].includes(values.category)) {
    errors.category = "Select a valid category.";
  }

  if (!values.joinDate) {
    errors.joinDate = "Join date is required.";
  }

  return errors;
}

export function MemberForm({ mode, member }: MemberFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [values, setValues] = useState<CreateMemberInput>({
    name: member?.name ?? "",
    mobileNumber: member?.mobileNumber ?? "",
    category: member?.category ?? "Male",
    joinDate: dateInputValue(member?.joinDate),
    isActive: member?.isActive ?? true,
    notes: member?.notes ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const cancelHref =
    mode === "edit" && member ? `/admin/members/${member._id}` : "/admin/members";

  function updateValue<K extends keyof CreateMemberInput>(
    key: K,
    value: CreateMemberInput[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    startTransition(async () => {
      const payload: CreateMemberInput = {
        ...values,
        name: values.name.trim(),
        mobileNumber: values.mobileNumber.trim(),
        notes: values.notes?.trim() ?? "",
      };
      const response =
        mode === "edit" && member
          ? await updateMember(member._id, payload)
          : await createMember(payload);

      if (!response.success) {
        setErrorMessage(response.message);
        setIsSubmitting(false);
        return;
      }

      window.location.replace("/admin/members");
    });
  }

  return (
    <SectionCard
      title={mode === "edit" ? "Edit Member" : "Member Information"}
      description="Enter accurate member details for records and billing."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errorMessage ? (
          <div className="rounded-xl border border-[#B91C1C]/20 bg-[#B91C1C]/10 px-3 py-2 text-[14px] font-medium text-[#B91C1C]">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <Input
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className="h-10 rounded-xl border-[#FFAA83] bg-white"
              placeholder="Member name"
            />
          </Field>

          <Field label="Mobile Number" error={errors.mobileNumber}>
            <Input
              value={values.mobileNumber}
              onChange={(event) =>
                updateValue("mobileNumber", event.target.value)
              }
              className="h-10 rounded-xl border-[#FFAA83] bg-white"
              inputMode="numeric"
              placeholder="9876543210"
            />
          </Field>

          <Field label="Category" error={errors.category}>
            <Select
              value={values.category}
              onValueChange={(value) =>
                updateValue("category", value as MemberCategory)
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-[#FFAA83] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Join Date" error={errors.joinDate}>
            <Input
              type="date"
              value={String(values.joinDate)}
              onChange={(event) => updateValue("joinDate", event.target.value)}
              className="h-10 rounded-xl border-[#FFAA83] bg-white"
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-[#FFAA83] bg-white px-3 py-2 text-[15px] text-[#3F0000]">
          <input
            type="checkbox"
            checked={Boolean(values.isActive)}
            onChange={(event) => updateValue("isActive", event.target.checked)}
            className="size-4 accent-[#9A3412]"
          />
          Active member
        </label>

        <Field label="Notes" error={errors.notes}>
          <Textarea
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            className="min-h-24 rounded-xl border-[#FFAA83] bg-white"
            placeholder="Optional notes"
          />
        </Field>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            render={<Link href={cancelHref} />}
            type="button"
            variant="outline"
            className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || isSubmitting}
            className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
          >
            {isPending || isSubmitting
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Save Member"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[14px] font-semibold text-[#3F0000]">{label}</span>
      {children}
      {error ? <span className="text-[12px] font-semibold text-[#B91C1C]">{error}</span> : null}
    </label>
  );
}
