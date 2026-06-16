"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import {
  useDeleteRepMutation,
  useGetAllRepsQuery,
  useUpdateRepMutation,
  useAssignFobMutation,
} from "@/redux/api/Rep/repApi";

import type { IRep } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type Column,
} from "@/components/ReUsableComponents/DataTable";
import { EntityModal } from "@/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { useRegisterRepMutation } from "@/redux/api/RepLogin/repAuthApi";
import { Clock, FileText, LogIn, Pen, Trash2, Timer, Nfc, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RepsPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetAllRepsQuery({});
  const [addRep, { isLoading: adding }] = useRegisterRepMutation();
  const [editRep, { isLoading: updating }] = useUpdateRepMutation();
  const [deleteRep] = useDeleteRepMutation();
  const [assignFob, { isLoading: assigningFob }] = useAssignFobMutation();

  const [open, setOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<IRep | null>(null);

  // Fob assignment dialog state
  const [fobDialog, setFobDialog] = useState<{ rep: IRep } | null>(null);
  const [fobInput, setFobInput] = useState("");

  const reps: IRep[] = data?.data || [];

  const handleAdd = async (values: Partial<IRep>) => {
    await addRep(values);
    setOpen(false);
    refetch();
  };

  const handleEdit = async (values: Partial<IRep>) => {
    if (!editingRep?._id) return;
    await editRep({ id: editingRep._id, ...values });
    setEditingRep(null);
    setOpen(false);
    refetch();
  };

  const handleLoginAsRep = (rep: IRep) => {
    const adminSession = localStorage.getItem("better-user");
    if (adminSession) {
      localStorage.setItem("impersonating-admin", adminSession);
      localStorage.setItem("is-impersonating", "true");
    }
    const repSession = {
      id: rep._id,
      name: rep.name,
      loginName: rep.loginName,
      repType: rep.repType,
      territory: rep.territory,
      role: "rep",
    };
    localStorage.setItem("better-user", JSON.stringify(repSession));
    const dest =
      rep.repType === "pps" ? "/pps"
      : rep.repType === "production" ? "/pps/stage/1"
      : rep.repType === "packaging" ? "/pps/stage/3"
      : rep.repType === "designer" ? "/designer"
      : "/rep/today-contact";
    setTimeout(() => {
      window.open(dest, "_blank");
    }, 30);
  };

  const handleAssignFob = async () => {
    if (!fobDialog) return;
    try {
      await assignFob({ id: fobDialog.rep._id, fobId: fobInput.trim() || null }).unwrap();
      toast.success(fobInput.trim() ? `Fob assigned to ${fobDialog.rep.name}` : `Fob removed from ${fobDialog.rep.name}`);
      setFobDialog(null);
      setFobInput("");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to assign fob");
    }
  };

  const openFobDialog = (rep: IRep) => {
    setFobInput(rep.fobId || "");
    setFobDialog({ rep });
  };

  const isEditing = Boolean(editingRep);

  const fields = isEditing
    ? [
        { name: "name", label: "Full Name", type: "text" as const },
        { name: "loginName", label: "Login Name", type: "text" as const },
        { name: "email", label: "Email", type: "email" as const },
        { name: "phone", label: "Phone", type: "phone" as const },
        {
          name: "repType",
          label: "Representative Type",
          type: "select" as const,
          options: [
            { label: "Sales Rep", value: "rep" },
            { label: "Delivery", value: "delivery" },
            { label: "Sales + Delivery", value: "both" },
            { label: "PPS (All Stages)", value: "pps" },
            { label: "Production (Stages 1 & 2)", value: "production" },
            { label: "Packaging (Stages 3 & 4)", value: "packaging" },
            { label: "Designer", value: "designer" },
          ],
        },
        {
          name: "payType",
          label: "Pay Type",
          type: "select" as const,
          options: [
            { label: "Hourly (Weekly Pay)", value: "hourly" },
            { label: "Salary (Semi-Monthly Pay)", value: "salary" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select" as const,
          options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Suspended", value: "suspended" },
          ],
        },
        { name: "territory", label: "Territory", type: "text" as const },
      ]
    : [
        { name: "name", label: "Full Name", type: "text" as const },
        { name: "loginName", label: "Login Name", type: "text" as const },
        { name: "password", label: "Password", type: "password" as const },
        { name: "email", label: "Email", type: "email" as const },
        { name: "phone", label: "Phone", type: "phone" as const },
        {
          name: "repType",
          label: "Representative Type",
          type: "select" as const,
          options: [
            { label: "Sales Rep", value: "rep" },
            { label: "Delivery", value: "delivery" },
            { label: "Sales + Delivery", value: "both" },
            { label: "PPS (All Stages)", value: "pps" },
            { label: "Production (Stages 1 & 2)", value: "production" },
            { label: "Packaging (Stages 3 & 4)", value: "packaging" },
            { label: "Designer", value: "designer" },
          ],
        },
        {
          name: "payType",
          label: "Pay Type",
          type: "select" as const,
          options: [
            { label: "Hourly (Weekly Pay)", value: "hourly" },
            { label: "Salary (Semi-Monthly Pay)", value: "salary" },
          ],
        },
        { name: "territory", label: "Territory", type: "text" as const },
      ];

  const columns: Column<IRep>[] = [
    { key: "name", header: "Name" },
    {
      key: "checkin",
      header: "Clock In",
      render: (rep) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-xs text-xs font-medium ${
            rep.checkin
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground border border-border dark:border-border"
          }`}
        >
          <span
            className={`w-2 h-2 mr-1 rounded-full ${
              rep.checkin
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "bg-gray-400 dark:bg-gray-600"
            }`}
          ></span>
          {rep.checkin ? "Clocked In" : "Clocked Out"}
        </span>
      ),
    },
    { key: "repType", header: "Type" },
    {
      key: "fobId",
      header: "Fob",
      render: (rep) =>
        rep.fobId ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
            <Nfc className="size-3" /> Assigned
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (rep) => (
        <div className="flex gap-2 items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer h-9 w-9 p-0 rounded-xs bg-transparent dark:hover:bg-secondary dark:hover:text-secondary-foreground"
            title="Assign Fob"
            onClick={() => openFobDialog(rep)}
          >
            <Nfc className="size-4" />
          </Button>
          <Link href={`/admin/reps/${rep._id}`}>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-9 w-9 p-0 rounded-xs bg-transparent dark:hover:bg-secondary dark:hover:text-secondary-foreground"
              title="View Clock In/Out"
            >
              <Clock className="size-4" />
            </Button>
          </Link>
          <Link href={`/admin/reps/notes/${rep._id}`}>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-9 w-9 p-0 rounded-xs bg-transparent dark:hover:bg-secondary dark:hover:text-secondary-foreground"
              title="View Notes"
            >
              <FileText className="size-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="default"
            className="cursor-pointer bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 h-9 w-9 p-0 rounded-xs text-primary-foreground"
            onClick={() => handleLoginAsRep(rep)}
            title="Login As Rep"
          >
            <LogIn className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer h-9 w-9 p-0 rounded-xs bg-transparent dark:hover:bg-secondary dark:hover:text-secondary-foreground"
            onClick={() => {
              setEditingRep(rep);
              setOpen(true);
            }}
            title="Edit"
          >
            <Pen className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer h-9 w-9 p-0 rounded-xs hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:border-destructive dark:hover:border-destructive bg-transparent"
                title="Delete"
              >
                <Trash2 className="size-4 text-destructive dark:text-destructive" />
              </Button>
            }
            title="Delete Representative"
            description={`Are you sure you want to delete ${rep.name}? This action cannot be undone.`}
            confirmText="Yes, Delete"
            onConfirm={() => deleteRep(rep._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4 bg-background text-foreground dark:bg-background dark:text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl font-semibold text-foreground dark:text-foreground">
          Sales Representatives
        </h1>
        <div className="flex w-full sm:w-auto gap-2">
          <Link href="/admin/reps/hours" className="w-1/2 sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto dark:bg-accent flex items-center justify-center gap-2 rounded-xs bg-accent text-white dark:hover:bg-secondary dark:hover:text-secondary-foreground cursor-pointer"
            >
              <Timer className="size-4" />
              Hours
            </Button>
          </Link>
          <Button
            onClick={() => {
              setEditingRep(null);
              setOpen(true);
            }}
            className="w-1/2 sm:w-auto cursor-pointer rounded-xs"
          >
            Add Representative
          </Button>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : reps.map((rep) => (
          <div key={rep._id} className="bg-card border border-border rounded-md p-4 space-y-3">
            {/* Name + clock status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{rep.name}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{rep.repType}</p>
                {rep.fobId && (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                    <Nfc className="size-3" /> Fob
                  </span>
                )}
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                rep.checkin
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                  : "bg-muted text-muted-foreground border border-border"
              }`}>
                <span className={`w-2 h-2 mr-1 rounded-full ${rep.checkin ? "bg-emerald-500" : "bg-gray-400"}`} />
                {rep.checkin ? "Clocked In" : "Clocked Out"}
              </span>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5 rounded-xs bg-transparent h-9 px-3"
                onClick={() => openFobDialog(rep)}
              >
                <Nfc className="size-4" />
                Fob
              </Button>
              <Link href={`/admin/reps/notes/${rep._id}`}>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5 rounded-xs bg-transparent h-9 px-3">
                  <FileText className="size-4" />
                  Notes
                </Button>
              </Link>
              <Link href={`/admin/reps/${rep._id}`}>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5 rounded-xs bg-transparent h-9 px-3">
                  <Clock className="size-4" />
                  Clock
                </Button>
              </Link>
              <Button
                size="sm"
                variant="default"
                className="flex items-center gap-1.5 rounded-xs h-9 px-3"
                onClick={() => handleLoginAsRep(rep)}
              >
                <LogIn className="size-4" />
                Login As
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5 rounded-xs bg-transparent h-9 px-3"
                onClick={() => { setEditingRep(rep); setOpen(true); }}
              >
                <Pen className="size-4" />
                Edit
              </Button>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="outline" className="flex items-center gap-1.5 rounded-xs bg-transparent h-9 px-3 hover:bg-destructive/10 hover:border-destructive">
                    <Trash2 className="size-4 text-destructive" />
                    Delete
                  </Button>
                }
                title="Delete Representative"
                description={`Are you sure you want to delete ${rep.name}? This action cannot be undone.`}
                confirmText="Yes, Delete"
                onConfirm={() => deleteRep(rep._id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: data table */}
      <div className="hidden md:block">
        <DataTable<IRep> columns={columns} data={reps} isLoading={isLoading} />
      </div>

      <EntityModal<IRep>
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={editingRep ? handleEdit : handleAdd}
        title={editingRep ? "Edit Representative" : "Add Representative"}
        fields={fields}
        initialData={editingRep || {}}
        isSubmitting={editingRep ? updating : adding}
      />

      {/* Fob Assignment Dialog */}
      <Dialog open={!!fobDialog} onOpenChange={(v) => { if (!v) { setFobDialog(null); setFobInput(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Nfc className="size-5" />
              Assign Fob — {fobDialog?.rep.name}
            </DialogTitle>
            <DialogDescription>
              Tap the fob on the USB reader (it will type the ID automatically), or type the fob ID manually.
              Leave blank and save to remove the fob.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Input
                autoFocus
                placeholder="Tap fob or type ID…"
                value={fobInput}
                onChange={(e) => setFobInput(e.target.value)}
                className="pr-10"
              />
              {fobInput && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setFobInput("")}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {fobDialog?.rep.fobId && (
              <p className="text-xs text-muted-foreground">
                Current fob: <span className="font-mono">{fobDialog.rep.fobId}</span>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setFobDialog(null); setFobInput(""); }}>
              Cancel
            </Button>
            {fobDialog?.rep.fobId && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={assigningFob}
                onClick={async () => {
                  setFobInput("");
                  await handleAssignFob();
                }}
              >
                Remove Fob
              </Button>
            )}
            <Button onClick={handleAssignFob} disabled={assigningFob}>
              {assigningFob ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
