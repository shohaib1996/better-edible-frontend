"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  PrivateLabelClient,
  useUpdateClientScheduleMutation,
} from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { SCHEDULE_INTERVAL_LABELS } from "@/constants/privateLabel";

interface RecurringScheduleSectionProps {
  client: PrivateLabelClient;
  onUpdate: () => void;
}

export const RecurringScheduleSection = ({
  client,
  onUpdate,
}: RecurringScheduleSectionProps) => {
  const [enabled, setEnabled] = useState(
    client.recurringSchedule?.enabled || false
  );
  const [interval, setInterval] = useState<
    "monthly" | "bimonthly" | "quarterly"
  >(client.recurringSchedule?.interval || "monthly");
  const [updateSchedule, { isLoading }] = useUpdateClientScheduleMutation();

  const handleSave = async () => {
    try {
      await updateSchedule({
        id: client._id,
        enabled,
        interval: enabled ? interval : undefined,
      }).unwrap();

      toast.success("Schedule updated successfully");
      onUpdate();
    } catch (error: unknown) {
      console.error("Error updating schedule:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update schedule");
    }
  };

  const hasChanges =
    enabled !== (client.recurringSchedule?.enabled || false) ||
    (enabled && interval !== client.recurringSchedule?.interval);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recurring Order Schedule</h3>

      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="recurring-toggle" className="text-base">
              Enable Recurring Orders
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically create orders on a regular schedule
            </p>
          </div>
          <Switch
            id="recurring-toggle"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Interval Selection */}
        {enabled && (
          <div>
            <Label htmlFor="interval">Order Interval</Label>
            <Select
              value={interval}
              onValueChange={(val: "monthly" | "bimonthly" | "quarterly") =>
                setInterval(val)
              }
            >
              <SelectTrigger id="interval" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Once per month</SelectItem>
                <SelectItem value="bimonthly">Every 2 months</SelectItem>
                <SelectItem value="quarterly">Every 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Current Status */}
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm">
            <span className="font-medium">Current Status: </span>
            {client.recurringSchedule?.enabled ? (
              <span className="text-green-600">
                Active -{" "}
                {
                  SCHEDULE_INTERVAL_LABELS[
                    client.recurringSchedule?.interval || "monthly"
                  ]
                }
              </span>
            ) : (
              <span className="text-muted-foreground">Disabled</span>
            )}
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        )}
      </div>
    </Card>
  );
};
