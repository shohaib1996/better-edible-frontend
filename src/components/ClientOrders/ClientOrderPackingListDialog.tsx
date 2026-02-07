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
import { IClientOrder } from "@/types";
import { generateClientOrderPackingList } from "@/utils/generateClientOrderPackingList";

interface ClientOrderPackingListDialogProps {
  order: IClientOrder | null;
  onClose: () => void;
}

export const ClientOrderPackingListDialog: React.FC<
  ClientOrderPackingListDialogProps
> = ({ order, onClose }) => {
  const [qaChecks, setQaChecks] = useState<{ [key: string]: boolean }>({});
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (order) {
      const initialChecks: { [key: string]: boolean } = {};
      order.items?.forEach((item) => {
        const key = `${item.productType}-${item.flavorName}`;
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
      const key = `${item.productType}-${item.flavorName}`;
      updatedChecks[key] = newValue;
    });
    setQaChecks(updatedChecks);
  };

  const handlePrint = () => {
    if (order) {
      generateClientOrderPackingList(order, qaChecks);
    }
  };

  const totalQuantity =
    order?.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) || 0;

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] rounded-xs w-[95vw] sm:w-full flex flex-col gap-4 border-border dark:border-white/20 bg-secondary dark:bg-card">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <span>📦</span> Client Order Packing List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 overflow-y-auto scrollbar-hidden flex-1 min-h-0">
          {/* Order Info */}
          <div className="bg-card p-3 sm:p-4 rounded-xs border border-border dark:border-white/20">
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {order.client?.store?.name || "Unknown Store"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {order.client?.store?.address}
              {order.client?.store?.city && `, ${order.client.store.city}`}
              {order.client?.store?.state && `, ${order.client.store.state}`}
            </p>
            <div className="mt-2 text-xs sm:text-sm space-y-1 text-foreground">
              <p>
                <span className="font-semibold">Order #:</span>{" "}
                {order.orderNumber}
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
          <div className="border border-border dark:border-white/20 rounded-xs overflow-hidden overflow-x-auto bg-card">
            <table className="w-full min-w-[600px]">
              <thead className="bg-primary/10 border-b border-border">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-foreground first:rounded-tl-xs">
                    #
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-foreground">
                    Product Type
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-foreground">
                    Flavor
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-semibold text-foreground">
                    Qty
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-semibold text-foreground last:rounded-tr-xs">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
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
                  const key = `${item.productType}-${item.flavorName}`;
                  const isChecked = qaChecks[key] || false;

                  return (
                    <tr
                      key={idx}
                      className={`border-t border-border ${
                        isChecked ? "bg-accent/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-foreground">
                        {item.productType}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-foreground">
                        {item.flavorName}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleCheckChange(key)}
                          aria-label={`QA for ${item.productType} - ${item.flavorName}`}
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border bg-secondary/30 font-semibold">
                  <td
                    colSpan={3}
                    className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-foreground"
                  >
                    Total Quantity:
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center text-foreground">
                    {totalQuantity}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-card p-2 sm:p-3 rounded-xs border border-border dark:border-white/20">
              <p className="text-xs sm:text-sm text-foreground">
                <span className="font-semibold">Note:</span> {order.note}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xs text-xs sm:text-sm px-3 sm:px-4 border-border dark:border-white/20 bg-card hover:bg-accent/50"
            >
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 sm:gap-2 rounded-xs text-xs sm:text-sm px-3 sm:px-4"
            >
              <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
              Print Slip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
