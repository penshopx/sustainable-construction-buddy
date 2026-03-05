import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

/**
 * Pre-process raw AI output:
 * 1. Strip <br>, <br/>, <br /> tags
 * 2. Turn lone lines starting with * or - (bold/italic markers used as bullets) into proper list items
 * 3. Ensure headings (###) have a blank line before them so they render as blocks
 */
function sanitize(raw: string): string {
  let text = raw
    // Remove <br> variants
    .replace(/<br\s*\/?>/gi, "\n")
    // Remove other common HTML noise
    .replace(/<\/?(?:div|span|font)[^>]*>/gi, "")
    // Ensure blank line before markdown headings so they parse correctly
    .replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2")
    // Lines that start with ***text or **text (not already a list) → add blank line before for paragraph break
    .replace(/\n(\*{1,3}[^*\n])/g, "\n\n$1");

  return text.trim();
}

/**
 * Shared markdown renderer with proper table styling and GFM support.
 * Use this everywhere instead of raw <ReactMarkdown>.
 */
export function MarkdownRenderer({ children, className = "" }: MarkdownRendererProps) {
  const cleaned = useMemo(() => sanitize(children), [children]);

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none 
      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 
      [&_p]:leading-relaxed [&_li]:leading-relaxed
      [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:my-3
      [&_thead]:bg-muted/50 [&_thead]:border-b-2 [&_thead]:border-border
      [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider
      [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-border [&_td]:text-foreground
      [&_tr:hover]:bg-muted/30
      [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
      [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2
      [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
      [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-2 [&_ol]:my-2
      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
      [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
      [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-xs
      [&_hr]:border-border [&_hr]:my-4
      [&_strong]:font-semibold [&_em]:italic
      ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border my-3">
              <table className="min-w-full">{children}</table>
            </div>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {children}
            </a>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
