"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRequestRevisionMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { CommentAuthorRole } from "@/types/designRequests/designRequests";
import { toast } from "sonner";

interface RequestRevisionModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
}

export function RequestRevisionModal({
  open,
  onClose,
  requestId,
  authorId,
  authorName,
  authorRole,
}: RequestRevisionModalProps) {
  const [message, setMessage] = useState("");
  const [requestRevision, { isLoading }] = useRequestRevisionMutation();

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await requestRevision({
        id: requestId,
        body: { authorId, authorName, message: trimmed },
      }).unwrap();
      toast.success("Revision requested");
      setMessage("");
      onClose();
    } catch {
      toast.error("Failed to request revision");
    }
  }

  function handleClose() {
    setMessage("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-xs">
        <DialogHeader>
          <DialogTitle>Request Changes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Describe what needs to be changed. The designer will be notified.
          </p>

          <Textarea
            placeholder="e.g. Please adjust the font size and change the background color to..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-xs min-h-[120px]"
            autoFocus
          />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xs" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xs"
              onClick={handleSubmit}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? "Sending..." : "Request Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
