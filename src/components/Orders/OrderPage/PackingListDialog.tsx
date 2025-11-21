"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IOrder } from "@/types";
import { generatePackingList } from "@/utils/generatePackingList";

interface PackingListDialogProps {
  order: IOrder | null;
  onClose: () => void;
}

export const PackingListDialog: React.FC<PackingListDialogProps> = ({
  order,
  onClose,
}) => {
  const [qaChecks, setQaChecks] = useState<{ [key: string]: boolean }>({});
  const [selectAll, setSelectAll] = useState(false);

  if (!order) return null;

  const uniqueKeys = order.items?.map(
    (item: any) => `${item.product}-${item.unitLabel || "none"}`
  );

  // ✅ Toggle individual checkbox
  const handleToggleQa = (key: string) => {
    setQaChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ Select / Deselect all checkboxes
  const handleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    const updatedChecks: { [key: string]: boolean } = {};
    uniqueKeys.forEach((key) => {
      updatedChecks[key] = newValue;
    });
    setQaChecks(updatedChecks);
  };

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-4">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold tracking-wide">
            PACKING LIST
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Scrollable Section */}
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          {/* Order Info */}
          <div className="space-y-2 text-sm text-gray-800">
            <p className="font-semibold text-blue-600">{order.store?.name}</p>
            <p>{order.store?.address}</p>
            <p className="mt-1">
              <strong>Order#:</strong> {order.orderNumber}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleString("en-US", {
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </p>
            <p>
              <strong>Delivery Date:</strong>{" "}
              {order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString("en-US")
                : "N/A"}
            </p>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-800 sticky top-0">
                <tr>
                  <th className="px-2 py-1 border">#</th>
                  <th className="px-2 py-1 border text-left">Product Name</th>
                  <th className="px-2 py-1 border">Cases</th>
                  <th className="px-2 py-1 border">Metric Tag</th>
                  <th className="px-2 py-1 border text-center">
                    <div className="flex items-center justify-center gap-1">
                      QA
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        title="Select all QA"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any, idx: number) => {
                  const uniqueKey = `${item.product}-${
                    item.unitLabel || "none"
                  }`;
                  return (
                    <tr key={uniqueKey}>
                      <td className="border px-2 py-1 text-center">
                        {idx + 1}
                      </td>
                      <td className="border px-2 py-1">
                        {item.name}
                        {item.unitLabel ? ` - ${item.unitLabel}` : ""}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {item.qty ?? 0}
                      </td>
                      <td className="border px-2 py-1 text-center">-</td>
                      <td className="border px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={qaChecks[uniqueKey] || false}
                          onChange={() => handleToggleQa(uniqueKey)}
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="border px-2 py-1 text-right">
                    Total Cases:
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {order.items?.reduce(
                      (sum: number, i: any) => sum + (i.qty ?? 0),
                      0
                    )}
                  </td>
                  <td colSpan={2} className="border px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {order.note && (
            <p className="text-xs text-gray-600 mt-2">Note: {order.note}</p>
          )}
        </div>

        {/* ✅ Fixed footer */}
        <div className="flex justify-between mt-4 border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => generatePackingList(order, qaChecks)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Print Slip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
