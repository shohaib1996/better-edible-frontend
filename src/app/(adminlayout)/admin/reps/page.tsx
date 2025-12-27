"use client";

import { useState } from "react";
import {
  useDeleteRepMutation,
  useGetAllRepsQuery,
  useUpdateRepMutation,
} from "@/redux/api/Rep/repApi";

import { IRep } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type Column,
} from "@/components/ReUsableComponents/DataTable";
import { EntityModal } from "@/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { useRegisterRepMutation } from "@/redux/api/RepLogin/repAuthApi";
import { Clock, FileText, LogIn, Pen, Trash2, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RepsPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetAllRepsQuery({});
  const [addRep, { isLoading: adding }] = useRegisterRepMutation();
  const [editRep, { isLoading: updating }] = useUpdateRepMutation();
  const [deleteRep] = useDeleteRepMutation();

  const [open, setOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<IRep | null>(null);

  const reps: IRep[] = data?.data || [];
  console.log(reps);

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

    // Open in a new tab
    setTimeout(() => {
      window.open("/rep/today-contact", "_blank");
    }, 30);
  };

  // inside RepsPage()

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
            { label: "Rep", value: "rep" },
            { label: "Delivery", value: "delivery" },
            { label: "Both", value: "both" },
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
            { label: "Rep", value: "rep" },
            { label: "Delivery", value: "delivery" },
            { label: "Both", value: "both" },
          ],
        },
        { name: "territory", label: "Territory", type: "text" as const },
      ];

  const columns: Column<IRep>[] = [
    { key: "name", header: "Name" },
    // { key: "_id", header: "ID" },
    {
      key: "territory",
      header: "Territory",
      render: (rep) => (
        <div className="max-w-[200px] wrap-break-word whitespace-normal">
          {rep.territory}
        </div>
      ),
    },
    {
      key: "checkin",
      header: "Clock In",
      render: (rep) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            rep.checkin
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-700 border border-gray-200"
          }`}
        >
          <span
            className={`w-2 h-2 mr-1 rounded-full ${
              rep.checkin ? "bg-emerald-500" : "bg-gray-400"
            }`}
          ></span>
          {rep.checkin ? "Clocked In" : "Clocked Out"}
        </span>
      ),
    },
    { key: "phone", header: "Phone" },
    { key: "repType", header: "Type" },
    {
      key: "status",
      header: "Status",
      render: (rep) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            rep.status === "active"
              ? "bg-green-100 text-green-700"
              : rep.status === "inactive"
              ? "bg-gray-100 text-gray-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {rep.status}
        </span>
      ),
    },
    {
      key: "storeCount",
      header: "Store Count",
      render: (rep) => (
        <span className="font-medium text-gray-700">
          {rep.storeCount || 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (rep) => (
        <div className="flex gap-3 items-center">
          <Link href={`/admin/reps/${rep._id}`}>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-9 w-9 p-0"
              title="View Clock In/Out"
            >
              <Clock className="size-4" />
            </Button>
          </Link>
          <Link href={`/admin/reps/notes/${rep._id}`}>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-9 w-9 p-0"
              title="View Notes"
            >
              <FileText className="size-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0"
            onClick={() => handleLoginAsRep(rep)}
            title="Login As Rep"
          >
            <LogIn className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0"
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
                className="h-9 w-9 p-0 hover:bg-red-50 hover:border-red-300"
                title="Delete"
              >
                <Trash2 className="size-4 text-red-600" />
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
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sales Representatives</h1>
        <div className="flex gap-2">
          <Link href="/admin/reps/hours">
            <Button
              variant="outline"
              className="flex items-center gap-2"
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
          >
            Add Representative
          </Button>
        </div>
      </div>

      <DataTable<IRep> columns={columns} data={reps} isLoading={isLoading} />

      <EntityModal<IRep>
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={editingRep ? handleEdit : handleAdd}
        title={editingRep ? "Edit Representative" : "Add Representative"}
        fields={fields}
        initialData={editingRep || {}}
        isSubmitting={editingRep ? updating : adding}
      />
    </div>
  );
}
