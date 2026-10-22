"use client";

import type {
  SerializedEventForSurvey,
  SerializedAttendee,
} from "@/lib/types/serialized";
import type { AdminForTestSend } from "@/lib/types/test-send";
import { useSurveySendForm } from "./use-survey-send-form";
import { StepSelect } from "./step-select";
import { StepEmail } from "./step-email";
import { StepConfirm } from "./step-confirm";

interface SurveySendFormProps {
  event: SerializedEventForSurvey;
  attendees: SerializedAttendee[];
  testSendAdmins: AdminForTestSend[];
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

export function SurveySendForm({
  event,
  attendees,
  testSendAdmins,
  defaultEmailTitle,
  defaultEmailBody,
}: SurveySendFormProps) {
  const form = useSurveySendForm({
    event,
    attendees,
    testSendAdmins,
    defaultEmailTitle,
    defaultEmailBody,
  });

  if (form.step === "email") {
    return <StepEmail event={event} form={form} />;
  }

  if (form.step === "confirm") {
    return <StepConfirm event={event} form={form} />;
  }

  return <StepSelect event={event} form={form} />;
}
