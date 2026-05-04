"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { IComment, CommentAuthorRole } from "@/types/designRequests/designRequests";
import { usePostCommentMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { toast } from "sonner";

const ROLE_BADGE: Record<CommentAuthorRole, string> = {
  store: "bg-blue-100 text-blue-700 border-blue-200",
  designer: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  rep: "bg-green-100 text-green-700 border-green-200",
};

const ROLE_LABEL: Record<CommentAuthorRole, string> = {
  store: "Store",
  designer: "Designer",
  admin: "Admin",
  rep: "Rep",
};

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return ts;
  }
}

interface CommentThreadProps {
  requestId: string;
  comments: IComment[];
  authorId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
}

export function CommentThread({
  requestId,
  comments,
  authorId,
  authorName,
  authorRole,
}: CommentThreadProps) {
  const [message, setMessage] = useState("");
  const [postComment, { isLoading }] = usePostCommentMutation();

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await postComment({
        id: requestId,
        body: { authorId, authorName, authorRole, message: trimmed },
      }).unwrap();
      setMessage("");
    } catch {
      toast.error("Failed to send comment");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Comments</p>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{c.authorName}</span>
                  <Badge
                    variant="outline"
                    className={`rounded-xs text-xs px-1.5 py-0 ${ROLE_BADGE[c.authorRole] ?? ""}`}
                  >
                    {ROLE_LABEL[c.authorRole] ?? c.authorRole}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatTs(c.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{c.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          placeholder="Write a comment..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-xs resize-none min-h-[72px] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <Button
          size="sm"
          className="rounded-xs h-9 px-3 shrink-0"
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Ctrl+Enter to send</p>
    </div>
  );
}
