import { readdir } from "fs/promises";
import { join } from "path";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DocsPage() {
  const docsDir = process.env.DOCS_DIR || join(process.cwd(), "..", "docs");
  const files = await readdir(docsDir);
  const mdFiles = files.filter((file) => file.endsWith(".md"));

  const fileNames = mdFiles.map((file) => {
    const slug = file.replace(".md", "");
    let displayName = slug;
    
    const nameMap: Record<string, string> = {
      "サイトマップ": "サイトマップ",
      "機能要件": "機能要件",
      "現状の業務フロー": "現状の業務フロー",
      "理想の業務フロー": "理想の業務フロー",
    };
    
    displayName = nameMap[slug] || slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    return { slug: encodeURIComponent(slug), displayName, fileName: file };
  });

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">仕様書一覧</h1>
        <p className="text-muted-foreground">
          docs/ディレクトリ内のMarkdownファイルを閲覧できます
        </p>
      </div>

      <div className="grid gap-4">
        {fileNames.map((file) => (
          <Link key={file.slug} href={`/docs/${file.slug}`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>{file.displayName}</CardTitle>
                <CardDescription>{file.fileName}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
