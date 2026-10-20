"use client";

import type { SerializedEventForRemind } from "@/lib/types/serialized";
import type { AdminForTestSend } from "@/lib/types/test-send";
import { useRemindForm } from "./use-remind-form";
import { StepRecipients } from "./step-recipients";
import { StepEmail } from "./step-email";
import { StepConfirm } from "./step-confirm";

interface RemindFormProps {
  event: SerializedEventForRemind;
  testSendAdmins: AdminForTestSend[];
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

export function RemindForm({
  event,
  testSendAdmins,
  defaultEmailTitle,
  defaultEmailBody,
}: RemindFormProps) {
  const form = useRemindForm({
    event,
    testSendAdmins,
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
