"use client";

import { useTransition, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSurveySchema } from "@/lib/validations/survey";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import { useFieldErrors } from "@/lib/hooks/use-field-errors";
import {
  saveSurveyAction,
  skipSurveyAction,
} from "@/lib/actions/survey.actions";

export type QuestionItem = {
  id?: number;
  clientId: string;
  title: string;
  sortOrder: number;
};

type UseSurveyFormProps = {
  eventId: number;
  initialQuestions: QuestionItem[];
};

export function useSurveyForm({ eventId, initialQuestions }: UseSurveyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const { fieldErrors, setFieldErrors, generalError, setGeneralError, clearFieldError } =
    useFieldErrors();

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [
      ...prev,
      {
        clientId: `q-${Date.now()}-${Math.random()}`,
        title: "",
        sortOrder: prev.length,
      },
    ]);
  }, []);

  const removeQuestion = useCallback((clientId: string) => {
    setQuestions((prev) =>
      prev
        .filter((q) => q.clientId !== clientId)
        .map((q, i) => ({ ...q, sortOrder: i }))
    );
    setFieldErrors({});
  }, [setFieldErrors]);

  const updateQuestionTitle = useCallback(
    (clientId: string, title: string) => {
      const index = questions.findIndex((q) => q.clientId === clientId);
      setQuestions((prev) =>
        prev.map((q) => (q.clientId === clientId ? { ...q, title } : q))
      );
      if (index !== -1) {
        clearFieldError(`questions.${index}.title`);
      }
    },
    [questions, clearFieldError]
  );

  const handleSave = useCallback(() => {
    setGeneralError(null);
    setFieldErrors({});

    const formData = {
      eventId,
      questions: questions.map((q) => ({
        id: q.id,
        title: q.title,
        sortOrder: q.sortOrder,
      })),
    };

    // クライアント側バリデーション
    const parsed = saveSurveySchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(formatZodFieldErrors(parsed.error));
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveSurveyAction(formData);
        if (result.success) {
          toast.success("アンケートを保存しました");
          router.push(`/admin/events/${eventId}/survey`);
        } else {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          if (result.error) {
            setGeneralError(result.error);
          }
        }
      } catch {
        setGeneralError("アンケートの保存に失敗しました");
      }
    });
  }, [eventId, questions, router, setFieldErrors, setGeneralError, startTransition]);

  const handlePreview = useCallback(() => {
    const previewQuestions = questions
      .filter((q) => q.title.trim() !== "")
      .map((q, index) => ({ ...q, sortOrder: index }));
    sessionStorage.setItem(
      `survey-preview-${eventId}`,
      JSON.stringify(previewQuestions)
    );
    window.open(`/events/${eventId}/survey/preview`, "_blank");
  }, [eventId, questions]);

  const handleSkip = useCallback(() => {
    setGeneralError(null);
    startTransition(async () => {
      try {
        const result = await skipSurveyAction(eventId);
        if (result.success) {
          toast.success("アンケートを作成しました");
          router.push(`/admin/events/${eventId}/survey`);
        } else {
          if (result.error) {
            setGeneralError(result.error);
          }
        }
      } catch {
        setGeneralError("アンケートの作成に失敗しました");
      }
    });
  }, [eventId, router, setGeneralError, startTransition]);

  return {
    isPending,
    questions,
    fieldErrors,
    generalError,
    addQuestion,
    removeQuestion,
    updateQuestionTitle,
    handleSave,
    handlePreview,
    handleSkip,
  };
}
