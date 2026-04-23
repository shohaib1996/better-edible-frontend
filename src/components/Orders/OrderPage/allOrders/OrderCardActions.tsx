"use client";

import { Truck, FileText, Pencil, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { generateInvoice } from "@/utils/invoiceGenerator";
import { getStatusSelectBg, STATUS_OPTIONS } from "./orderStatusHelpers";
import type { IOrder } from "@/types";

const iconBtnBase =
  "h-8 w-8 rounded-xs bg-accent text-white border border-border dark:border-gray-600 hover:bg-primary hover:text-white transition-colors dark:bg-accent dark:text-white";

interface OrderCardActionsProps {
  order: IOrder;
  isOwnOrder: boolean;
  isSample: boolean;
  onDelivery: () => void;
  onEdit: () => void;
  onPackingList: () => void;
  onStatusChange: (value: string) => void;
  onUnauthorized: () => void;
}

function ActionButton({
  label,
  icon,
  onClick,
  isOwnOrder,
  className = iconBtnBase,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isOwnOrder: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(className, !isOwnOrder && "opacity-50 cursor-not-allowed")}
          onClick={onClick}
          disabled={!isOwnOrder}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function OrderCardActions({
  order,
  isOwnOrder,
  isSample,
  onDelivery,
  onEdit,
  onPackingList,
  onStatusChange,
  onUnauthorized,
}: OrderCardActionsProps) {
  const guard = (fn: () => void) => () => isOwnOrder ? fn() : onUnauthorized();

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 md:mt-0">
      <ActionButton
        label="Delivery"
        icon={<Truck className="h-4 w-4" />}
        onClick={guard(onDelivery)}
        isOwnOrder={isOwnOrder}
        className={cn(
          iconBtnBase,
          isSample && "border-purple-400 dark:border-purple-600"
        )}
      />

      {!isSample && (
        <>
          <ActionButton
            label="Generate Invoice"
            icon={<FileText className="h-4 w-4" />}
            onClick={guard(() => generateInvoice(order))}
            isOwnOrder={isOwnOrder}
          />
          <ActionButton
            label="Edit"
            icon={<Pencil className="h-4 w-4" />}
            onClick={guard(onEdit)}
            isOwnOrder={isOwnOrder}
            className="h-8 w-8 rounded-xs bg-secondary text-white border border-secondary hover:bg-primary hover:text-white transition-colors dark:bg-secondary dark:text-white"
          />
          <ActionButton
            label="Packing List"
            icon={<ClipboardList className="h-4 w-4" />}
            onClick={guard(onPackingList)}
            isOwnOrder={isOwnOrder}
          />
        </>
      )}

      <Select
        value={order.status}
        onValueChange={(value) => isOwnOrder ? onStatusChange(value) : onUnauthorized()}
        disabled={!isOwnOrder}
      >
        <SelectTrigger
          className={cn(
            "h-8! w-24 text-xs font-semibold rounded-xs border-none focus:ring-0 gap-1 [&>svg]:ml-0",
            isOwnOrder ? getStatusSelectBg(order.status) : "bg-gray-400 cursor-not-allowed text-white"
          )}
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="text-sm rounded-xs">
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s} className="capitalize font-medium rounded-xs">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
