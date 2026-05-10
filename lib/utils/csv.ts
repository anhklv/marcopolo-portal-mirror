/**
 * CSV フィールドのエスケープ（カンマ・改行・ダブルクォート対応）
 * CSV インジェクション対策で =,+,-,@ 始まりはシングルクォートを前置（Excel 等の数式解釈を避ける）
 * 単独の「-」（欠損表示など）は数式にならないため前置しない（表示が '- になるのを防ぐ）
 */
export function escapeCsvField(value: string): string {
  let sanitized = value;
  if (/^[=+\-@]/.test(sanitized) && sanitized !== "-") {
    sanitized = "'" + sanitized;
  }

  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return '"' + sanitized.replace(/"/g, '""') + '"';
  }
  return sanitized;
}

/**
 * ヘッダ行＋データ行から BOM 付き CSV 文字列を生成する（管理画面エクスポート共通）
 */
export function encodeCsvDocument(headers: string[], rows: string[][]): string {
  const BOM = "\uFEFF";
  const csvLines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];
  return BOM + csvLines.join("\n");
}
