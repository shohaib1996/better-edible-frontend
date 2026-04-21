"use client";

import { useState } from "react";
import { Plus, Loader2, Palette, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetColorsQuery,
  useCreateColorMutation,
  useToggleColorMutation,
  useUpdateColorMutation,
  useDeleteColorMutation,
} from "@/redux/api/color/colorsApi";
import type { IProductColor } from "@/types/privateLabel/pps";

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditColorDialog({ color }: { color: IProductColor }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(color.name);
  const [hexPreview, setHexPreview] = useState(color.hexPreview ?? "");
  const [defaultAmount, setDefaultAmount] = useState(
    color.defaultAmount !== undefined ? String(color.defaultAmount) : "",
  );
  const [updateColor, { isLoading }] = useUpdateColorMutation();

  const handleSave = async () => {
    try {
      await updateColor({
        colorId: color.colorId,
        name: name.trim() || undefined,
        hexPreview: hexPreview.trim() || undefined,
        defaultAmount: defaultAmount !== "" ? Number(defaultAmount) : undefined,
      }).unwrap();
      toast.success("Color updated");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update color");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Edit color"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-xs">
        <DialogHeader>
          <DialogTitle>Edit Color</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xs"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              Hex Preview (e.g. #FF0000)
            </Label>
            <div className="flex gap-2">
              <Input
                value={hexPreview}
                onChange={(e) => setHexPreview(e.target.value)}
                placeholder="#RRGGBB"
                className="rounded-xs flex-1"
              />
              {hexPreview.match(/^#[0-9A-Fa-f]{6}$/) && (
                <div
                  className="w-10 h-10 rounded-xs border shrink-0"
                  style={{ backgroundColor: hexPreview }}
                />
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              Default Amount (g per mold)
            </Label>
            <Input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="Optional"
              className="rounded-xs"
            />
          </div>
          <Button
            className="w-full rounded-xs"
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function ColorsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("");
  const [newDefaultAmount, setNewDefaultAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<IProductColor | null>(null);

  const { data, isLoading } = useGetColorsQuery();
  const [createColor, { isLoading: isCreating }] = useCreateColorMutation();
  const [toggleColor] = useToggleColorMutation();
  const [deleteColor] = useDeleteColorMutation();

  const colors = data?.colors ?? [];
  const activeCount = colors.filter((c) => c.isActive).length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await createColor({
        name: newName.trim(),
        hexPreview: newHex.trim() || undefined,
        defaultAmount:
          newDefaultAmount !== "" ? Number(newDefaultAmount) : undefined,
      }).unwrap();
      toast.success(`Color "${res.color.name}" created`);
      setNewName("");
      setNewHex("");
      setNewDefaultAmount("");
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create color");
    }
  };

  const handleToggle = async (color: IProductColor) => {
    try {
      const res = await toggleColor(color.colorId).unwrap();
      toast.success(
        `"${res.color.name}" ${res.color.isActive ? "activated" : "deactivated"}`,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update color");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteColor(deleteTarget.colorId).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete color");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-medium">Colors ({colors.length})</h3>
          <p className="text-sm text-muted-foreground">{activeCount} active</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xs">
              <Plus className="w-4 h-4 mr-1" />
              Add Color
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xs">
            <DialogHeader>
              <DialogTitle>Add New Color</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block">Color Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Red #40"
                  className="rounded-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">
                  Hex Preview (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newHex}
                    onChange={(e) => setNewHex(e.target.value)}
                    placeholder="#FF0000"
                    className="rounded-xs flex-1"
                  />
                  {newHex.match(/^#[0-9A-Fa-f]{6}$/) && (
                    <div
                      className="w-10 h-10 rounded-xs border shrink-0"
                      style={{ backgroundColor: newHex }}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">
                  Default Amount (g per mold) — optional
                </Label>
                <Input
                  type="number"
                  value={newDefaultAmount}
                  onChange={(e) => setNewDefaultAmount(e.target.value)}
                  placeholder="e.g. 2"
                  className="rounded-xs"
                />
              </div>
              <Button
                className="w-full rounded-xs"
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
              >
                {isCreating && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Create Color
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading colors…</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && colors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Palette className="w-10 h-10 opacity-30" />
          <p className="text-sm">No colors yet. Add your first color above.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && colors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {colors.map((color) => (
            <Card key={color._id} className="rounded-xs py-0">
              <CardContent className="px-3 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {color.hexPreview ? (
                      <div
                        className="w-5 h-5 rounded-xs border shrink-0"
                        style={{ backgroundColor: color.hexPreview }}
                      />
                    ) : (
                      <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {color.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {color.colorId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <EditColorDialog color={color} />
                    <button
                      type="button"
                      className="p-1 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete color"
                      onClick={() => setDeleteTarget(color)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Badge
                      variant="outline"
                      className={
                        color.isActive
                          ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                          : "bg-muted text-muted-foreground border-border text-xs"
                      }
                    >
                      {color.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {color.defaultAmount !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Default:{" "}
                    <span className="font-semibold text-foreground">
                      {color.defaultAmount}g
                    </span>{" "}
                    / mold
                  </p>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xs text-xs h-7"
                  onClick={() => handleToggle(color)}
                >
                  {color.isActive ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
