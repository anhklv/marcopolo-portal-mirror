"use client";

import type {
  SerializedEventForSurvey,
  SerializedAttendee,
} from "@/lib/types/serialized";
import { useSurveySendForm } from "./use-survey-send-form";
import { StepSelect } from "./step-select";
import { StepEmail } from "./step-email";
import { StepConfirm } from "./step-confirm";

interface SurveySendFormProps {
  event: SerializedEventForSurvey;
  attendees: SerializedAttendee[];
  adminEmail: string;
  defaultEmailTitle: string;
  defaultEmailBody: string;
}

export function SurveySendForm({
  event,
  attendees,
  adminEmail,
  defaultEmailTitle,
  defaultEmailBody,
}: SurveySendFormProps) {
  const form = useSurveySendForm({
    event,
    attendees,
    adminEmail,
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
