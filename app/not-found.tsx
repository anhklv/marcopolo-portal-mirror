export const metadata = {
  title: "ページが見つかりません",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          ページが見つかりません
        </p>
        <p className="mt-6 text-sm text-muted-foreground">Marcopolo</p>
      </div>
    </div>
  );
}
