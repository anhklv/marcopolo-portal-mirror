import { readFile } from "fs/promises";
import { join } from "path";
import { MarkdownContent } from "@/components/docs/markdown-content";

const DOCS_DIR = process.env.DOCS_DIR || join(process.cwd(), "docs");
const PAGE_LIST_FILE = "ページ実装完了リスト_20260220.md";

export default async function PageListPage() {
  const filePath = join(DOCS_DIR, PAGE_LIST_FILE);
  const content = await readFile(filePath, "utf-8");

  return (
    <div>
      <MarkdownContent content={content} />
    </div>
  );
}
