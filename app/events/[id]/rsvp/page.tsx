import { findRsvpByToken } from "@/lib/repositories/rsvp.repository";
import { serializeRsvpForPage } from "@/lib/serializers/rsvp";
import { RsvpForm } from "./_components/rsvp-form";
import { AlertCircle } from "lucide-react";
import { Stack } from "@/components/ui/stack";

// ============================================================
// メタデータ
// ============================================================

export const metadata = {
  title: "出欠回答",
};

// ============================================================
// エラー画面コンポーネント
// ============================================================

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
          <Stack gap="md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              アクセスエラー
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </Stack>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ページコンポーネント
// ============================================================

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const eventId = Number(id);

  // トークン未指定 or イベントID不正
  if (!token || isNaN(eventId)) {
    return (
      <ErrorPage message="このページにアクセスするには有効な案内URLが必要です。" />
    );
  }

  // トークンでRSVP取得（1回のDBクエリでevent+customerも取得）
  const rsvp = await findRsvpByToken(token);

  // トークン無効 or イベントIDが一致しない
  if (!rsvp || rsvp.eventId !== eventId) {
    return (
      <ErrorPage message="このページにアクセスするには有効な案内URLが必要です。" />
    );
  }

  // イベント論理削除チェック
  if (rsvp.event.deletedAt) {
    return <ErrorPage message="このイベントは終了しました。" />;
  }

  // 顧客論理削除チェック
  if (rsvp.customer.deletedAt) {
    return <ErrorPage message="このページにアクセスできません。" />;
  }

  // isPausedチェック → エラーページ表示
  if (rsvp.event.isPaused) {
    return <ErrorPage message="現在、回答の受付を停止しています。" />;
  }

  // シリアライズしてClient Componentへ渡す
  const data = serializeRsvpForPage(rsvp);

  return <RsvpForm data={data} />;
}
