"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdatePrivateLabelClientMutation } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { IPrivateLabelClient, PrivateLabelClientStatus } from "@/types";

interface EditClientInfoModalProps {
  open: boolean;
  onClose: () => void;
  client: IPrivateLabelClient;
  onSuccess: () => void;
  isRepView?: boolean;
}

export const EditClientInfoModal = ({
  open,
  onClose,
  client,
  onSuccess,
  isRepView = false,
}: EditClientInfoModalProps) => {
  const [contactEmail, setContactEmail] = useState(client.contactEmail);
  const [assignedRepId, setAssignedRepId] = useState(client.assignedRep._id);
  const [status, setStatus] = useState<PrivateLabelClientStatus>(client.status);

  const { data: repsData, isLoading: repsLoading } = useGetAllRepsQuery({}, { skip: isRepView });
  const [updateClient, { isLoading: updating }] =
    useUpdatePrivateLabelClientMutation();

  // Reset form when client changes
  useEffect(() => {
    setContactEmail(client.contactEmail);
    setAssignedRepId(client.assignedRep._id);
    setStatus(client.status);
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactEmail.trim()) {
      toast.error("Contact email is required");
      return;
    }

    try {
      await updateClient({
        id: client._id,
        contactEmail: contactEmail.trim(),
        // Rep cannot change assigned rep - keep original
        assignedRepId: isRepView ? client.assignedRep._id : assignedRepId,
        status,
      }).unwrap();

      toast.success("Client info updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update client info");
    }
  };

  const reps = repsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Client Info</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Name (read-only) */}
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input value={client.store?.name || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Store info cannot be changed here
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@store.com"
              required
            />
          </div>

          {/* Assigned Rep - Only show for admin, read-only for rep */}
          <div className="space-y-2">
            <Label htmlFor="assignedRep">Assigned Rep</Label>
            {isRepView ? (
              <>
                <Input value={client.assignedRep?.name || ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Assigned rep cannot be changed
                </p>
              </>
            ) : repsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading reps...
              </div>
            ) : (
              <Select value={assignedRepId} onValueChange={setAssignedRepId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rep" />
                </SelectTrigger>
                <SelectContent>
                  {reps.map((rep: { _id: string; name: string }) => (
                    <SelectItem key={rep._id} value={rep._id}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as PrivateLabelClientStatus)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
