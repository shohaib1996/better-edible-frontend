"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  FileText,
  ShoppingCart,
  Truck,
  Calendar,
  FilePlus,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { IStore } from "@/types";

interface StoreListItemProps {
  store: any;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (store: any) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (store: any) => void;
  onOpenOrders: (storeId: string) => void;
  onOpenDelivery: (store: any) => void;
  onOpenFollowup: (store: IStore) => void;
  onOpenCreateOrder: (store: IStore) => void;
  onAddNote: (store: IStore) => void;
}

export const StoreListItem = ({
  store,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onOpenNotes,
  onOpenOrders,
  onOpenDelivery,
  onOpenFollowup,
  onOpenCreateOrder,
  onAddNote,
}: StoreListItemProps) => {
  const hasDue = store.dueAmount > 0;
  const paymentColor =
    store.paymentStatus === "red"
      ? "text-red-500 dark:text-red-400"
      : store.paymentStatus === "yellow"
      ? "text-yellow-600 dark:text-yellow-500"
      : store.paymentStatus === "green"
      ? "text-green-600 dark:text-green-500"
      : "text-muted-foreground";

  return (
    <Card
      className={`p-3 shadow-sm hover:shadow-md gap-2 transition-all rounded-xs flex flex-col h-full ${
        store.blocked ? "opacity-70 border-destructive/30" : ""
      }`}
    >
      {/* Header: Checkbox + Store Name */}
      <div className="flex items-start gap-2 mb-3">
        <Checkbox
          className="border-accent shrink-0 mt-1"
          checked={selected}
          onCheckedChange={() => onSelect(store._id)}
        />
        <div className="flex-1 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3
                  className="text-base text-foreground font-bold relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full cursor-pointer truncate w-full"
                  onClick={() => onAddNote(store)}
                >
                  {store.name}
                </h3>
              </TooltipTrigger>
              {store.name && store.name.length > 25 && (
                <TooltipContent>
                  <p>{store.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {store.address || "No address"}
          </p>
        </div>
      </div>

      {/* Contact & Rep Info */}
      <div className="flex-1 text-xs bg-muted/30 dark:bg-muted/50 p-2 rounded-xs mb-3 space-y-2">
        {/* Contact */}
        {Array.isArray(store?.contacts) && store.contacts.length > 0 ? (
          <div>
            <span className="text-foreground font-semibold block">
              {store.contacts[0]?.name}
            </span>
            {store.contacts[0]?.role && (
              <span className="text-muted-foreground text-xs">
                {store.contacts[0].role}
              </span>
            )}
            {store.contacts[0]?.importantToKnow && (
              <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                <strong>Important:</strong> {store.contacts[0].importantToKnow}
              </div>
            )}
          </div>
        ) : null}

        {/* Rep */}
        {store.rep && (
          <div>
            <strong className="text-foreground">Rep:</strong>{" "}
            <span className="text-primary font-medium">
              {store.rep.name || store.rep}
            </span>
          </div>
        )}

        {/* Status */}
        <div>
          <strong className="text-foreground">Status:</strong>{" "}
          {store.blocked ? (
            <span className="text-red-600 dark:text-red-400 font-medium">
              Paused
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Active
            </span>
          )}
        </div>

        {/* Due Amount */}
        {hasDue && (
          <div>
            <strong className="text-foreground">Due:</strong>{" "}
            <span className={`font-semibold ${paymentColor}`}>
              ${store.dueAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <TooltipProvider>
        <div className="flex items-center gap-1 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xs cursor-pointer h-7 w-7 p-0"
                onClick={() => onOpenNotes(store)}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notes</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xs cursor-pointer h-7 w-7 p-0"
                onClick={() => onOpenCreateOrder(store)}
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Order</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xs cursor-pointer h-7 w-7 p-0"
                onClick={() => onOpenOrders(store._id)}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Orders</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xs cursor-pointer h-7 w-7 p-0"
                onClick={() => onOpenDelivery(store)}
              >
                <Truck className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delivery</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer h-7 w-7 p-0"
                onClick={() => onOpenFollowup(store)}
              >
                <Calendar className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Follow Up</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xs bg-card border-2 border-foreground/20 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-foreground/30 transition-all cursor-pointer h-7 w-7 p-0"
                onClick={() => onEdit(store)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>

          <ConfirmDialog
            triggerText="Delete"
            onConfirm={() => onDelete(store._id)}
            title={`Delete ${store.name}?`}
            description="This action cannot be undone."
            confirmText="Yes, delete"
          />
        </div>
      </TooltipProvider>
    </Card>
  );
};
