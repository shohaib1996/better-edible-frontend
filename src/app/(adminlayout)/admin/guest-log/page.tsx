"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useGetGuestLogsQuery } from "@/redux/api/GuestLog/guestLogApi";
import { Users } from "lucide-react";

export default function GuestLogPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data, isLoading, isError } = useGetGuestLogsQuery({ startDate, endDate });
  const logs: any[] = data?.data ?? data ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guest Log</h1>
        <span className="ml-auto text-sm text-gray-400">OLCC Compliance Record</span>
      </div>

      {/* Date filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <span className="text-sm text-gray-400 ml-auto">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="flex justify-center py-16 text-gray-400">Loading…</div>
      )}

      {isError && (
        <div className="flex justify-center py-16 text-red-400">Failed to load guest log.</div>
      )}

      {!isLoading && !isError && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-base">No guest sign-ins in this date range.</p>
        </div>
      )}

      {!isLoading && !isError && logs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">#</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date of Birth</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Sign-In Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log: any, i: number) => {
                const signedIn = new Date(log.createdAt ?? log.signedInAt ?? log.timestamp);
                const dob = log.dob ? new Date(log.dob + "T00:00:00") : null;
                return (
                  <tr
                    key={log._id ?? log.id ?? i}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{log.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {dob ? dob.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {isNaN(signedIn.getTime())
                        ? "—"
                        : signedIn.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
