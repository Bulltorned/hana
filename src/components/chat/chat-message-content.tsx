"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ChatMessageContentProps {
  content: string;
  isStreaming?: boolean;
  onActionClick?: (prompt: string) => void;
}

interface ParsedAction {
  label: string;
  prompt: string;
}

interface ParsedContent {
  text: string;
  actions: ParsedAction[];
}

function parseContent(content: string): ParsedContent {
  const actionsMatch = content.match(/:::actions\n([\s\S]*?):::/);

  if (!actionsMatch) {
    return { text: content.trim(), actions: [] };
  }

  const text = content.replace(/:::actions\n[\s\S]*?:::/, "").trim();
  const actionsBlock = actionsMatch[1];

  const actions: ParsedAction[] = [];
  const actionRegex = /- \[(.+?)\]\((.+?)\)/g;
  let match;

  while ((match = actionRegex.exec(actionsBlock)) !== null) {
    actions.push({ label: match[1], prompt: match[2] });
  }

  return { text, actions };
}

export function ChatMessageContent({
  content,
  isStreaming,
  onActionClick,
}: ChatMessageContentProps) {
  const { text, actions } = useMemo(() => parseContent(content), [content]);

  return (
    <div>
      {/* Markdown rendered text */}
      <div className="chat-markdown">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => (
              <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>
            ),
            li: ({ children }) => <li className="text-sm">{children}</li>,
            h1: ({ children }) => (
              <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <pre className="bg-black/[0.04] rounded-lg p-3 my-2 overflow-x-auto">
                    <code className="text-xs font-mono">{children}</code>
                  </pre>
                );
              }
              return (
                <code className="bg-black/[0.06] rounded px-1.5 py-0.5 text-xs font-mono">
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-brand-indigo/30 pl-3 my-2 text-muted-foreground italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-brand-indigo/[0.08] my-3" />,
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-indigo underline underline-offset-2"
              >
                {children}
              </a>
            ),
          }}
        >
          {text}
        </ReactMarkdown>

        {/* Typing cursor */}
        {isStreaming && (
          <span className="inline-block w-[2px] h-[14px] bg-brand-indigo ml-0.5 align-text-bottom animate-blink" />
        )}
      </div>

      {/* Action buttons */}
      {actions.length > 0 && !isStreaming && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-brand-indigo/[0.08]">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => onActionClick?.(action.prompt)}
              className="h-7 text-[11px] font-medium bg-brand-indigo/[0.04] border-brand-indigo/[0.12] hover:bg-brand-indigo/[0.08] hover:border-brand-indigo/[0.2] text-brand-indigo gap-1.5 rounded-full px-3"
            >
              {action.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
