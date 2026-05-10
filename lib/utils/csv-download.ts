/**
 * 管理画面の CSV ダウンロード用（クライアントのみで使用）
 *
 * 文字列をそのまま Blob に渡すと、環境によって UTF-8 BOM の解釈がずれることがある。
 * 先頭をバイト列 EF BB BF（UTF-8 BOM）で固定し、本文は TextEncoder で UTF-8 化してから結合する。
 */

const UTF8_BOM_BYTES = new Uint8Array([0xef, 0xbb, 0xbf]);

/**
 * UTF-8 BOM（EF BB BF）＋本文を UTF-8 バイト列で返す（Excel が UTF-8 と認識しやすくする）
 */
export function getUtf8CsvWithBomBytes(csvContent: string): Uint8Array {
  const withoutBom = csvContent.replace(/^\uFEFF/, "");
  const bodyBytes = new TextEncoder().encode(withoutBom);
  const combined = new Uint8Array(UTF8_BOM_BYTES.length + bodyBytes.length);
  combined.set(UTF8_BOM_BYTES, 0);
  combined.set(bodyBytes, UTF8_BOM_BYTES.length);
  return combined;
}

/**
 * UTF-8 BOM 付きの CSV 用 Blob（Excel の文字化け防止用に BOM をバイト単位で付与）
 */
export function buildUtf8CsvBlob(csvContent: string): Blob {
  const bytes = getUtf8CsvWithBomBytes(csvContent);
  return new Blob([new Uint8Array(bytes)], {
    type: "text/csv;charset=utf-8",
  });
}

/**
 * ファイル保存ダイアログで CSV をダウンロード（UTF-8 BOM 付き）
 */
export function downloadUtf8CsvFile(csvContent: string, filename: string): void {
  const blob = buildUtf8CsvBlob(csvContent);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}
