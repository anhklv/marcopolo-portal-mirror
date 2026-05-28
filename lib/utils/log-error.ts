import {
  formatPrismaErrorDetails,
  isPrismaErrorLike,
} from "@/lib/utils/prisma-error";

function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

/**
 * サーバー側エラーログ（Vercel Function Logs / 開発ターミナル向け）
 * 将来 Sentry 連携時はここに captureException を追加する
 */
export function logServerError(context: string, error: unknown): void {
  const message = formatErrorDetails(error);

  if (isPrismaErrorLike(error)) {
    console.error(
      `[${context}] ${message} (${formatPrismaErrorDetails(error)})`,
      error instanceof Error ? error.stack : error
    );
    return;
  }

  console.error(`[${context}] ${message}`, error);
}
