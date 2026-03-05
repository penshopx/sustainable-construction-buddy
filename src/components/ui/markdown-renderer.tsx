import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React, { useMemo } from "react";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

/**
 * Pre-process raw AI / course content:
 * 1. Strip stray HTML tags (<br>, <div>, <span>, <font>)
 * 2. Ensure blank lines before headings so they render as blocks
 * 3. Outside tables, ensure bold/italic lines start a new paragraph
 * 4. Normalise multiple blank lines to max two
 */
function sanitize(raw: string): string {
  let text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:div|span|font)[^>]*>/gi, "");

  const lines = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const inTable = line.trimStart().startsWith("|");
    const prevLine = i > 0 ? lines[i - 1] : "";

    if (!inTable) {
      if (/^#{1,6}\s/.test(line) && prevLine.trim() !== "") result.push("");
      if (/^\*{1,3}[^*\n]/.test(line) && prevLine.trim() !== "") result.push("");
    }
    result.push(line);
  }

  return result
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Shared markdown renderer with professional table, code-block, and prose styling.
 */
export function MarkdownRenderer({ children, className = "" }: MarkdownRendererProps) {
  const cleaned = useMemo(() => sanitize(children), [children]);

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          /* ——— Headings ——— */
          h1: ({ children }) => (
            <h1 className="text-xl font-bold font-heading text-foreground mt-6 mb-3 pb-2 border-b border-border">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold font-heading text-foreground mt-5 mb-2 pb-1.5 border-b border-border/50">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold font-heading text-foreground mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h4>
          ),

          /* ——— Paragraph ——— */
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-foreground/90 mb-3">{children}</p>
          ),

          /* ——— Lists ——— */
          ul: ({ children }) => (
            <ul className="text-sm list-disc pl-5 space-y-1.5 mb-3 text-foreground/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-sm list-decimal pl-5 space-y-1.5 mb-3 text-foreground/90">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),

          /* ——— Table ——— */
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border my-4 shadow-sm">
              <table className="min-w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-foreground border-b-2 border-border whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-sm text-foreground/90 border-b border-border/60 align-top">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),

          /* ——— Blockquote ——— */
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 bg-primary/5 rounded-r-lg pl-4 pr-3 py-3 my-4 text-sm italic text-foreground/80">
              {children}
            </blockquote>
          ),

          /* ——— Code blocks (ASCII diagrams, etc.) ——— */
          pre: ({ children }) => (
            <pre className="bg-muted/70 border border-border/50 rounded-lg p-4 my-4 overflow-x-auto text-xs leading-relaxed font-mono whitespace-pre">
              {children}
            </pre>
          ),
          code: ({ children, className: codeClassName }) => {
            // Inline code vs block code
            const isBlock = codeClassName?.startsWith("language-");
            if (isBlock) {
              return <code className="text-xs font-mono">{children}</code>;
            }
            return (
              <code className="bg-muted/80 border border-border/40 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          },

          /* ——— Horizontal rule ——— */
          hr: () => <hr className="border-border my-5" />,

          /* ——— Links ——— */
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),

          /* ——— Strong / Em ——— */
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
