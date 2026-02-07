import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MarkdownContent } from "@/components/docs/markdown-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  // Docker環境では /app/docs、ローカルでは ../../docs
  const docsDir = process.env.DOCS_DIR || join(process.cwd(), "..", "..", "docs");
  
  try {
    const filePath = join(docsDir, `${decodedSlug}.md`);
    const content = await readFile(filePath, "utf-8");

    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="p-8">
          <article className="markdown-content">
            <MarkdownContent content={content} />
          </article>
        </Card>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

export async function generateStaticParams() {
  // Docker環境では /app/docs、ローカルでは ../../docs
  const docsDir = process.env.DOCS_DIR || join(process.cwd(), "..", "..", "docs");
  const files = await readdir(docsDir);
  const mdFiles = files.filter((file) => file.endsWith(".md"));

  return mdFiles.map((file) => {
    const slug = file.replace(".md", "");
    return {
      slug: encodeURIComponent(slug),
    };
  });
}

