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
import { Clock, FileText, LogIn } from "lucide-react";
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

    // Avoid router.push because the reload cancels it
    setTimeout(() => {
      window.location.href = "/rep/today-contact";
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
    { key: "territory", header: "Territory" },
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
      key: "actions",
      header: "Actions",
      render: (rep) => (
        <div className="flex gap-2">
          <Link href={`/admin/reps/${rep._id}`}>
            <Button size="sm" variant="outline" className="cursor-pointer">
              <Clock className="size-4 mr-1" />
            </Button>
          </Link>
          <Link href={`/admin/reps/notes/${rep._id}`}>
            <Button size="sm" variant="outline" className="cursor-pointer">
              <FileText className="size-4 mr-1" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 h-8"
            onClick={() => handleLoginAsRep(rep)}
          >
            <LogIn className="size-4 mr-1" />
            Login As
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingRep(rep);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <ConfirmDialog
            triggerText="Delete"
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
        <Button
          onClick={() => {
            setEditingRep(null);
            setOpen(true);
          }}
        >
          Add Representative
        </Button>
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
