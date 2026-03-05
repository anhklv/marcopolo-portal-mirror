import Link from "next/link";
import { CLIENT_DOCS } from "@/lib/client-docs";

export default function PreviewIndexPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-2xl font-bold tracking-tight mb-6">ドキュメント一覧</h1>
      <ul className="space-y-2">
        {CLIENT_DOCS.map((doc) => (
          <li key={doc.slug}>
            <Link href={`/docs/${doc.slug}`} className="text-primary hover:underline">
              {doc.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
