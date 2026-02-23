"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireAuthenticatedAdmin,
  canAccessEvent,
} from "@/lib/auth/permissions";
import { eventSchema } from "@/lib/validations/event";
import { formatZodFieldErrors } from "@/lib/validations/utils";
import * as eventRepo from "@/lib/repositories/event.repository";

// ============================================================
// 追加の型定義
// ============================================================

export type DeleteEventResult =
  | { success: true }
  | { success: false; error: string };

export type TogglePauseEventResult =
  | { success: true; isPaused: boolean }
  | { success: false; error: string };

// ============================================================
// 型定義
// ============================================================

export type EventActionResult =
  | { success: true; eventId: number }
  | { success: false; error?: string; fieldErrors?: Record<string, string[]> };

// ============================================================
// Actions
// ============================================================

/**
 * イベント新規作成
 */
export async function createEventAction(
  formData: unknown
): Promise<EventActionResult> {
  // 認証
  const { isSuper, scopedCommunityIds } = await requireAuthenticatedAdmin();

  // バリデーション
  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodFieldErrors(parsed.error) };
  }

  const data = parsed.data;

  // スコープ検証
  if (!isSuper) {
    if (!scopedCommunityIds.includes(data.communityId)) {
      return { success: false, error: "権限のないコミュニティが指定されています" };
    }
  }

  // 作成
  try {
    const event = await eventRepo.createEvent({
      communityId: data.communityId,
      title: data.title,
      date: data.date,
      location: data.location || null,
      description: data.description || null,
      timetable: data.timetable || null,
      note: data.note || null,
      responseDeadline: data.responseDeadline ?? null,
      allowsOnline: data.allowsOnline ?? false,
      hasAfterParty: data.hasAfterParty ?? false,
    });

    revalidatePath("/admin/events");
    return { success: true, eventId: event.id };
  } catch {
    return { success: false, error: "イベントの作成に失敗しました" };
  }
}

/**
 * イベント更新
 */
export async function updateEventAction(
  eventId: number,
  formData: unknown
): Promise<EventActionResult | void> {
  // 認証
  const { admin, isSuper, scopedCommunityIds } = await requireAuthenticatedAdmin();

  // アクセス権チェック
  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { success: false, error: "このイベントへのアクセス権がありません" };
  }

  // バリデーション
  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodFieldErrors(parsed.error) };
  }

  const data = parsed.data;

  // スコープ検証（変更先コミュニティも検証）
  if (!isSuper) {
    if (!scopedCommunityIds.includes(data.communityId)) {
      return { success: false, error: "権限のないコミュニティが指定されています" };
    }
  }

  // 更新
  try {
    await eventRepo.updateEvent(eventId, {
      communityId: data.communityId,
      title: data.title,
      date: data.date,
      location: data.location || null,
      description: data.description || null,
      timetable: data.timetable || null,
      note: data.note || null,
      responseDeadline: data.responseDeadline ?? null,
      allowsOnline: data.allowsOnline ?? false,
      hasAfterParty: data.hasAfterParty ?? false,
    });
  } catch {
    return { success: false, error: "イベントの更新に失敗しました" };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

/**
 * イベント削除（論理削除）
 */
export async function deleteEventAction(
  eventId: number
): Promise<DeleteEventResult | void> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // アクセス権チェック
  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { success: false, error: "このイベントへのアクセス権がありません" };
  }

  // 論理削除
  try {
    await eventRepo.softDeleteEvent(eventId);
  } catch {
    return { success: false, error: "イベントの削除に失敗しました" };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

/**
 * イベント一時停止/再開トグル
 */
export async function togglePauseEventAction(
  eventId: number
): Promise<TogglePauseEventResult> {
  // 認証
  const { admin } = await requireAuthenticatedAdmin();

  // アクセス権チェック
  const hasAccess = await canAccessEvent(admin, eventId);
  if (!hasAccess) {
    return { success: false, error: "このイベントへのアクセス権がありません" };
  }

  // トグル
  try {
    const updated = await eventRepo.toggleEventPause(eventId);
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/admin/events");
    return { success: true, isPaused: updated.isPaused };
  } catch {
    return { success: false, error: "イベントのステータス変更に失敗しました" };
  }
}
