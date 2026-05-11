"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">500</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          予期せぬエラーが発生しました
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
