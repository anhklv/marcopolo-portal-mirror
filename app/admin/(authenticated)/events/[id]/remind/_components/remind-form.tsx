"use client";

import type { SerializedEventForRemind } from "@/lib/types/serialized";
import { useRemindForm } from "./use-remind-form";
import { StepRecipients } from "./step-recipients";
import { StepEmail } from "./step-email";
import { StepConfirm } from "./step-confirm";

interface RemindFormProps {
  event: SerializedEventForRemind;
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

export function RemindForm({
  event,
  adminEmail,
  defaultEmailTitle,
  defaultEmailBody,
}: RemindFormProps) {
  const form = useRemindForm({
    event,
    adminEmail,
    defaultEmailTitle,
    defaultEmailBody,
  });

  if (form.step === "email") {
    return <StepEmail event={event} form={form} />;
  }

  if (form.step === "confirm") {
    return <StepConfirm form={form} event={event} />;
  }

  return <StepRecipients event={event} form={form} />;
}
