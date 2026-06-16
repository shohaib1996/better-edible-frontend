"use client";
export const dynamic = 'force-dynamic';

import { BookOpen } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Coming Soon</p>
        <p className="text-sm mt-1">Resources and documentation will be available here.</p>
      </div>
    </div>
  );
}
