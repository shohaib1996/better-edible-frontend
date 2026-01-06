"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { IOrder } from "@/types";
import { generatePackingList } from "@/utils/generatePackingList";
import {
  Store,
  Calendar,
  Package,
  Printer,
  X,
  ClipboardList,
} from "lucide-react";

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

  const handleToggleQa = (key: string) => {
    setQaChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
      <DialogContent className="max-w-2xl p-0 rounded-xs border border-border bg-card dark:bg-card max-h-[85vh] overflow-y-auto scrollbar-hidden">
        <DialogHeader className="sticky top-0 z-10 bg-secondary/30 dark:bg-secondary/10 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-bold text-foreground dark:text-foreground">
                PACKING LIST
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:text-white dark:hover:bg-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="bg-secondary/30 dark:bg-secondary/10 rounded-xs p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Store className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-primary dark:text-primary">
                  {order.store?.name}
                </p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {order.store?.address}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground dark:text-muted-foreground">
                  Order#:
                </span>
                <span className="font-medium text-foreground dark:text-foreground">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground dark:text-muted-foreground">
                  Order:
                </span>
                <span className="font-medium text-foreground dark:text-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground dark:text-muted-foreground">
                  Delivery:
                </span>
                <span className="font-medium text-foreground dark:text-foreground">
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString("en-US")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xs overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-secondary/50 dark:bg-secondary/20 text-foreground dark:text-foreground">
                <tr>
                  <th className="px-2 py-2 border-b border-border text-center w-10">
                    #
                  </th>
                  <th className="px-2 py-2 border-b border-border text-left">
                    Product Name
                  </th>
                  <th className="px-2 py-2 border-b border-border text-center w-20">
                    Cases
                  </th>
                  <th className="px-2 py-2 border-b border-border text-center w-24">
                    Metric Tag
                  </th>
                  <th className="px-2 py-2 border-b border-border text-center w-16">
                    <div className="flex items-center justify-center gap-1">
                      QA
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        title="Select all QA"
                        className="h-4 w-4 rounded-xs accent-primary cursor-pointer"
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
                    <tr
                      key={uniqueKey}
                      className="hover:bg-secondary/20 dark:hover:bg-secondary/10 transition-colors"
                    >
                      <td className="border-b border-border px-2 py-2 text-center text-muted-foreground dark:text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="border-b border-border px-2 py-2 text-foreground dark:text-foreground">
                        {item.name}
                        {item.unitLabel ? ` - ${item.unitLabel}` : ""}
                      </td>
                      <td className="border-b border-border px-2 py-2 text-center font-medium text-foreground dark:text-foreground">
                        {item.qty ?? 0}
                      </td>
                      <td className="border-b border-border px-2 py-2 text-center text-muted-foreground dark:text-muted-foreground">
                        -
                      </td>
                      <td className="border-b border-border px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={qaChecks[uniqueKey] || false}
                          onChange={() => handleToggleQa(uniqueKey)}
                          className="h-4 w-4 rounded-xs accent-primary cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-secondary/30 dark:bg-secondary/10 font-semibold">
                  <td
                    colSpan={2}
                    className="px-2 py-2 text-right text-foreground dark:text-foreground"
                  >
                    Total Cases:
                  </td>
                  <td className="px-2 py-2 text-center text-primary dark:text-primary">
                    {order.items?.reduce(
                      (sum: number, i: any) => sum + (i.qty ?? 0),
                      0
                    )}
                  </td>
                  <td colSpan={2} className="px-2 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {order.note && (
            <div className="bg-secondary/30 dark:bg-secondary/10 rounded-xs p-3">
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                <span className="font-medium text-foreground dark:text-foreground">
                  Note:
                </span>{" "}
                {order.note}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card dark:bg-card border-t border-border px-4 py-3 flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xs border-border hover:bg-secondary/30 dark:hover:bg-secondary/20 bg-transparent"
          >
            Close
          </Button>
          <Button
            onClick={() => generatePackingList(order, qaChecks)}
            className="rounded-xs bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Slip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
