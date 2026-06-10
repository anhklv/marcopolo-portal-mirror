/**
 * 客向けドキュメントプレビュー用の許可リスト。
 * いずれ削除するため、本番コードから分離して管理する。
 */
export const CLIENT_DOCS: { slug: string; docPath: string; label: string }[] = [
  { slug: "req", docPath: "要件定義書", label: "要件定義書" },
  { slug: "design", docPath: "画面設計書", label: "画面設計書" },
  { slug: "pagelist", docPath: "ページ実装完了リスト_20260220", label: "ページ実装完了リスト" },
  { slug: "report-20251216", docPath: "報告/報告20251216", label: "報告 › 報告20251216" },
  { slug: "report-20251225", docPath: "報告/報告20251225", label: "報告 › 報告20251225" },
  { slug: "report-20260128", docPath: "報告/報告20260128", label: "報告 › 報告20260128" },
  { slug: "report-20260216", docPath: "報告/報告20260216", label: "報告 › 報告20260216" },
  { slug: "report-20260309", docPath: "報告/報告20260309", label: "報告 › 報告20260309" },
  { slug: "report-20260406", docPath: "報告/報告20260406", label: "報告 › 報告20260406" },
  { slug: "report-20260511", docPath: "報告/報告20260511", label: "報告 › 報告20260511" },
  { slug: "report-20260608", docPath: "報告/報告20260608", label: "報告 › 報告20260608" },
  { slug: "report-20260610", docPath: "報告/報告20260610", label: "報告 › 報告20260610" },
  { slug: "concerns-20260610", docPath: "リリース前懸念リスト_20260610", label: "リリース前懸念リスト（2026年6月10日）" },
];

export function getDocBySlug(slug: string): { docPath: string; label: string } | null {
  const doc = CLIENT_DOCS.find((d) => d.slug === slug);
  return doc ? { docPath: doc.docPath, label: doc.label } : null;
}
