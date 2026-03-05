import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDocBySlug } from "@/lib/client-docs";
import { MarkdownContent } from "@/components/docs/markdown-content";

const DOCS_DIR = process.env.DOCS_DIR || join(process.cwd(), "docs");

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PreviewDocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  const filePath = join(DOCS_DIR, `${doc.docPath}.md`);

  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
          ← 一覧に戻る
        </Link>
      </div>
      <article className="rounded-lg border bg-card p-8">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
}
