"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { ProposeFormData } from "./_types";

interface ProposeFormProps {
  submitting: boolean;
  error: string;
  onSubmit: (data: ProposeFormData) => void;
  onCancel: () => void;
}

const EMPTY: ProposeFormData = {
  title: "", description: "", proposedDiscount: "",
  proposedStartDate: "", proposedEndDate: "", notes: "",
};

export function ProposeForm({ submitting, error, onSubmit, onCancel }: ProposeFormProps) {
  const [form, setForm] = useState<ProposeFormData>(EMPTY);
  const set = (key: keyof ProposeFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Card className="p-5 mb-6" style={{ background: "#fffdf5", border: "1px solid #c45a1a40" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#2a2518" }}>
        Propose a Custom Promotion
      </h3>
      <p className="text-xs mb-4" style={{ color: "#6b6045" }}>
        Have a promotion idea? Submit it for our team to review. If approved, we&apos;ll create the
        promotion and notify you.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: "#4a4535" }}>
            Promotion Title *
          </label>
          <input
            className="w-full px-3 py-2 rounded text-sm border outline-none"
            style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
            placeholder="e.g. 4th of July Flash Sale"
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: "#4a4535" }}>
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 rounded text-sm border outline-none resize-none"
            style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
            rows={2}
            placeholder="What's the promotion about?"
            value={form.description}
            onChange={set("description")}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#4a4535" }}>
            Proposed Discount % *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            className="w-full px-3 py-2 rounded text-sm border outline-none"
            style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
            placeholder="e.g. 20"
            value={form.proposedDiscount}
            onChange={set("proposedDiscount")}
          />
        </div>
        <div />

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#4a4535" }}>
            Start Date *
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded text-sm border outline-none"
            style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
            value={form.proposedStartDate}
            onChange={set("proposedStartDate")}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#4a4535" }}>
            End Date *
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded text-sm border outline-none"
            style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
            value={form.proposedEndDate}
            onChange={set("proposedEndDate")}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: "#4a4535" }}>
            Additional Notes
          </label>
          <textarea
            className="w-full px-3 py-2 rounded text-sm border outline-none resize-none"
            style={{ border: "1px solid #d6d0b4", background: "#fff", color: "#2a2518" }}
            rows={2}
            placeholder="Any context or special requests for our team…"
            value={form.notes}
            onChange={set("notes")}
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs px-3 py-2 rounded" style={{ background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onSubmit(form)}
          disabled={submitting}
          className="px-5 py-2 rounded text-xs font-semibold transition-opacity"
          style={{ background: "#c45a1a", color: "#fff", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Submitting…" : "Submit Proposal"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded text-xs font-medium"
          style={{ background: "#f5f2e8", color: "#4a4535" }}
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}
