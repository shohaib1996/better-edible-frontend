"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";
import { IComment, CommentAuthorRole } from "@/types/designRequests/designRequests";
import { usePostCommentMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { toast } from "sonner";

const ROLE_CONFIG: Record<CommentAuthorRole, { label: string; dot: string; badge: string }> = {
  store:    { label: "Store",    dot: "bg-blue-500",   badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  designer: { label: "Designer", dot: "bg-purple-500", badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  admin:    { label: "Admin",    dot: "bg-red-500",    badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
  rep:      { label: "Rep",      dot: "bg-green-500",  badge: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
};

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch {
    return ts;
  }
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface CommentThreadProps {
  requestId: string;
  comments: IComment[];
  authorId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
}

export function CommentThread({ requestId, comments, authorId, authorName, authorRole }: CommentThreadProps) {
  const [message, setMessage] = useState("");
  const [postComment, { isLoading }] = usePostCommentMutation();

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await postComment({ id: requestId, body: { authorId, authorName, authorRole, message: trimmed } }).unwrap();
      setMessage("");
    } catch {
      toast.error("Failed to send comment");
    }
  }

  return (
    <div className="bg-card border border-border rounded-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-semibold">
          Comments
          {comments.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">({comments.length})</span>
          )}
        </p>
      </div>

      {/* Thread */}
      <div className="px-4 py-4 space-y-4 max-h-80 overflow-y-auto scrollbar-hidden">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet — start the conversation.</p>
          </div>
        ) : (
          comments.map((c) => {
            const cfg = ROLE_CONFIG[c.authorRole] ?? ROLE_CONFIG.store;
            const isMe = !!authorId && (c.authorId === authorId || (c.authorRole === authorRole && c.authorName === authorName));
            return (
              <div key={c._id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xs flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${cfg.dot}`}>
                  {getInitials(c.authorName)}
                </div>

                {/* Bubble */}
                <div className={`flex-1 max-w-[80%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`flex items-center gap-1.5 flex-wrap ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-xs font-semibold">{isMe ? "You" : c.authorName}</span>
                    <span className={`text-[10px] font-medium border rounded-xs px-1.5 py-0 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatTs(c.createdAt)}</span>
                  </div>
                  <div className={`rounded-xs px-3 py-2 text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {c.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-2 border-t border-border space-y-2">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Write a message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-xs resize-none min-h-[72px] text-sm flex-1 bg-background border-border"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <Button
            size="sm"
            className="rounded-xs h-9 w-9 p-0 shrink-0"
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Ctrl + Enter to send</p>
      </div>
    </div>
  );
}
