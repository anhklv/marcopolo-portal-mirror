"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content space-y-4 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const url = href || "";
            if (url.startsWith("/")) {
              return (
                <Link href={url} className="text-primary hover:underline" {...props}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="my-6 overflow-x-auto">
                <table className="w-full border-collapse text-sm" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th className="border border-border bg-muted px-4 py-2 text-left font-medium" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="border border-border px-4 py-2" {...props}>
                {children}
              </td>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="mt-8 mb-4 text-lg font-semibold border-b pb-2" {...props}>
                {children}
              </h2>
            );
          },
          h1({ children, ...props }) {
            return (
              <h1 className="mb-6 text-2xl font-bold tracking-tight" {...props}>
                {children}
              </h1>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
