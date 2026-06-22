"use client";

import { useState } from "react";
import AdminEnrollmentsTab from "@/components/Promotions/admin/AdminEnrollmentsTab";
import AdminCompanyPromotionsTab from "@/components/Promotions/admin/AdminCompanyPromotionsTab";

type Tab = "enrollments" | "promotions";

const TABS: { key: Tab; label: string }[] = [
  { key: "enrollments", label: "Enrollments" },
  { key: "promotions", label: "Company Promotions" },
];

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("enrollments");

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Promotions Program</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage store enrollments and company-wide promotions.
        </p>
      </div>

      <div className="flex gap-0.5 flex-wrap p-1 bg-muted/60 border border-border rounded-xs w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-xs text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "enrollments" && <AdminEnrollmentsTab />}
      {activeTab === "promotions" && <AdminCompanyPromotionsTab />}
    </div>
  );
}
