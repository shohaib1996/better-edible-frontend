"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer } from "lucide-react";
import { IPrivateLabelOrder } from "@/types";
import { generatePrivateLabelPackingList } from "@/utils/generatePrivateLabelPackingList";

interface PrivateLabelPackingListDialogProps {
  order: IPrivateLabelOrder | null;
  onClose: () => void;
}

export const PrivateLabelPackingListDialog: React.FC<
  PrivateLabelPackingListDialogProps
> = ({ order, onClose }) => {
  const [qaChecks, setQaChecks] = useState<{ [key: string]: boolean }>({});
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (order) {
      const initialChecks: { [key: string]: boolean } = {};
      order.items?.forEach((item) => {
        const key = `${item.privateLabelType}-${item.flavor}`;
        initialChecks[key] = false;
      });
      setQaChecks(initialChecks);
      setSelectAll(false);
    }
  }, [order]);

  const handleCheckChange = (key: string) => {
    setQaChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    const updatedChecks: { [key: string]: boolean } = {};
    order?.items?.forEach((item) => {
      const key = `${item.privateLabelType}-${item.flavor}`;
      updatedChecks[key] = newValue;
    });
    setQaChecks(updatedChecks);
  };

  const handlePrint = () => {
    if (order) {
      generatePrivateLabelPackingList(order, qaChecks);
    }
  };

  const totalQuantity =
    order?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) || 0;

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-700">
            🏷️ Private Label Packing List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-bold text-lg text-orange-800">
              {order.store?.name}
            </h3>
            <p className="text-sm text-gray-600">{order.store?.address}</p>
            <div className="mt-2 text-sm space-y-1">
              <p>
                <span className="font-semibold">Order ID:</span>{" "}
                {order._id.slice(-8).toUpperCase()}
              </p>
              <p>
                <span className="font-semibold">Order Date:</span>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              {order.deliveryDate && (
                <p>
                  <span className="font-semibold">Delivery Date:</span>{" "}
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Product Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">
                    Flavor
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <span>QA</span>
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const key = `${item.privateLabelType}-${item.flavor}`;
                  const isChecked = qaChecks[key] || false;

                  return (
                    <tr
                      key={idx}
                      className={`border-t ${
                        isChecked ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {item.privateLabelType}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.flavor}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleCheckChange(key)}
                          aria-label={`QA for ${item.privateLabelType} - ${item.flavor}`}
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t bg-orange-50 font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-sm text-right">
                    Total Quantity:
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {totalQuantity}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm">
                <span className="font-semibold">Note:</span> {order.note}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Slip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
