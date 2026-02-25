"use client";

import type { SerializedEventForInvite, SerializedCustomerForInvite } from "@/lib/types/serialized";
import type { CommunityOption } from "@/lib/types/serialized";
import { useInviteForm } from "./use-invite-form";
import { StepSelect } from "./step-select";
import { StepEmail } from "./step-email";
import { StepConfirm } from "./step-confirm";

interface InviteFormProps {
  event: SerializedEventForInvite;
  customers: SerializedCustomerForInvite[];
  currentUserRole: "super" | "community_admin";
  communities: CommunityOption[];
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

export function InviteForm({
  event,
  customers,
  currentUserRole,
  communities,
  adminEmail,
  defaultEmailTitle,
  defaultEmailBody,
}: InviteFormProps) {
  const form = useInviteForm({
    event,
    customers,
    communities,
    adminEmail,
    defaultEmailTitle,
    defaultEmailBody,
  });

  if (form.step === "email") {
    return <StepEmail form={form} />;
  }

  if (form.step === "confirm") {
    return <StepConfirm form={form} />;
  }

  return (
    <StepSelect
      event={event}
      communities={communities}
      currentUserRole={currentUserRole}
      form={form}
    />
  );
}
