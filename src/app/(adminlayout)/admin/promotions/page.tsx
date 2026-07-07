"use client";
import { Suspense } from "react";
import AdminPromotionsContent from "./promotions-content";

export default function AdminPromotionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <AdminPromotionsContent />
    </Suspense>
  );
}
