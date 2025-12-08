"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";
import Link from "next/link";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidKey, setMermaidKey] = useState(0);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    if (mermaidRef.current) {
      const mermaidElements = mermaidRef.current.querySelectorAll(".mermaid:not([data-processed])");
      mermaidElements.forEach(async (element, index) => {
        const code = element.textContent || "";
        if (code.trim()) {
          element.setAttribute("data-processed", "true");
          try {
            const id = `mermaid-${Date.now()}-${index}`;
            const { svg } = await mermaid.render(id, code);
            element.innerHTML = svg;
          } catch (error) {
            console.error("Mermaid rendering error:", error);
            element.innerHTML = `<pre class="text-red-500">Mermaid rendering error: ${error instanceof Error ? error.message : String(error)}</pre>`;
          }
        }
      });
    }
  }, [content, mermaidKey]);

  return (
    <div ref={mermaidRef} key={mermaidKey}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (match && match[1] === "mermaid") {
              return (
                <div className="mermaid flex justify-center my-8 overflow-x-auto" {...(props as any)}>
                  {codeString}
                </div>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a({ node, href, children, ...props }) {
            let newHref = href || "";
            if (href && href.endsWith('.md')) {
               // 相対パス (./xxx.md) または 単なるファイル名 (xxx.md) を処理
               const fileName = href.split('/').pop()?.replace('.md', '');
               newHref = `/docs/${fileName}`;
               
               return (
                 <Link href={newHref} className="text-blue-600 hover:underline" {...props}>
                   {children}
                 </Link>
               );
            }
            
            return (
              <a href={newHref} className="text-blue-600 hover:underline" {...props}>
                {children}
              </a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
