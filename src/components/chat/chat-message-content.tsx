"use client";

import { useMemo } from "react";
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
  // Extract :::actions block
  const actionsMatch = content.match(/:::actions\n([\s\S]*?):::/);

  if (!actionsMatch) {
    return { text: content.trim(), actions: [] };
  }

  const text = content.replace(/:::actions\n[\s\S]*?:::/, "").trim();
  const actionsBlock = actionsMatch[1];

  // Parse action links: - [Label](prompt)
  const actions: ParsedAction[] = [];
  const actionRegex = /- \[(.+?)\]\((.+?)\)/g;
  let match;

  while ((match = actionRegex.exec(actionsBlock)) !== null) {
    actions.push({
      label: match[1],
      prompt: match[2],
    });
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
      {/* Text content with typing cursor */}
      <div className="whitespace-pre-wrap">
        {text}
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
