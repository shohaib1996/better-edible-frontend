"use client";

import { Loader2, Pencil, Trash, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export type ContactItem = {
  _id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  importantToKnow?: string;
  store?: string;
  editing?: boolean;
  isNew?: boolean;
  saving?: boolean;
  deleting?: boolean;
};

const inputCls =
  "border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary disabled:opacity-60";

interface Props {
  contact: ContactItem;
  idx: number;
  resettingId: string | null;
  onToggleEdit: (idx: number) => void;
  onFieldChange: (idx: number, field: keyof ContactItem, value: string) => void;
  onSave: (idx: number) => void;
  onDelete: (idx: number) => void;
  onResetPassword: (id: string, name: string) => void;
}

export function ContactCard({
  contact: c,
  idx,
  resettingId,
  onToggleEdit,
  onFieldChange,
  onSave,
  onDelete,
  onResetPassword,
}: Props) {
  const busy = c.saving || c.deleting || resettingId === c._id;

  return (
    <Card className="p-4 rounded-xs border-border bg-card">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Name *</Label>
              <Input
                value={c.name}
                onChange={(e) => onFieldChange(idx, "name", e.target.value)}
                disabled={!c.editing}
                placeholder="Contact name"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Role</Label>
              <Input
                value={c.role}
                onChange={(e) => onFieldChange(idx, "role", e.target.value)}
                disabled={!c.editing}
                placeholder="Role"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Email</Label>
              <Input
                value={c.email}
                onChange={(e) => onFieldChange(idx, "email", e.target.value)}
                disabled={!c.editing}
                placeholder="Email"
                type="email"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Phone</Label>
              <Input
                value={c.phone}
                onChange={(e) => onFieldChange(idx, "phone", e.target.value)}
                disabled={!c.editing}
                placeholder="Phone"
                type="tel"
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Important things to know</Label>
            <Textarea
              value={c.importantToKnow}
              onChange={(e) => onFieldChange(idx, "importantToKnow", e.target.value)}
              disabled={!c.editing}
              placeholder="Important to know"
              className={`${inputCls} resize-none min-h-[60px]`}
              rows={2}
            />
          </div>
        </div>

        <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 lg:min-w-[100px]">
          {busy ? (
            <Loader2 className="animate-spin h-5 w-5 text-primary" />
          ) : (
            <>
              {!c.editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleEdit(idx)}
                  className="rounded-xs border hover:text-primary hover:bg-muted cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                  <Button
                    onClick={() => onSave(idx)}
                    size="sm"
                    className="flex-1 lg:flex-none rounded-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => onToggleEdit(idx)}
                    size="sm"
                    className="flex-1 lg:flex-none rounded-xs bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {c._id && !c.isNew && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResetPassword(c._id!, c.name)}
                  title="Reset password to store ZIP"
                  className="rounded-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30 cursor-pointer"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset PW
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(idx)}
                title="Delete Contact"
                className="rounded-xs border-destructive/30 text-destructive hover:bg-accent hover:text-white cursor-pointer"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
