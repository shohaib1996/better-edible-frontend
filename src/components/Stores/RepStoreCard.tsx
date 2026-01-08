"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Package,
} from "lucide-react";
import { IStore } from "@/types";

interface RepStoreCardProps {
  store: any;
  onEdit: (store: any) => void;
  onOpenNotes: (store: any) => void;
  onOpenOrders: (storeId: string) => void;
  onOpenDelivery: (store: any) => void;
  onOpenFollowup: (store: IStore) => void;
  onOpenSample: (store: IStore) => void;
  onAddNote: (store: IStore) => void;
}

export const RepStoreCard = ({
  store,
  onEdit,
  onOpenNotes,
  onOpenOrders,
  onOpenDelivery,
  onOpenFollowup,
  onOpenSample,
  onAddNote,
}: RepStoreCardProps) => {
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
      className={`p-4 shadow-sm hover:shadow-md transition-all rounded-xs gap-0 ${
        store.blocked ? "opacity-70 border-destructive/30" : ""
      }`}
    >
      {/* TOP: Store Info + Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2">
        {/* Store Name & Address */}
        <div className="flex-1">
          <h3
            className="text-lg text-foreground font-bold relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
            onClick={() => onAddNote(store)}
          >
            {store.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {store.address || "No address"}
          </p>
        </div>

        {/* Action Buttons */}
        <TooltipProvider>
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xs cursor-pointer"
                  onClick={() => onOpenNotes(store)}
                >
                  <FileText className="h-4 w-4" />
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
                  className="rounded-xs cursor-pointer"
                  onClick={() => onOpenOrders(store._id)}
                >
                  <ShoppingCart className="h-4 w-4" />
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
                  className="rounded-xs cursor-pointer"
                  onClick={() => onOpenDelivery(store)}
                >
                  <Truck className="h-4 w-4" />
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
                  className="rounded-xs cursor-pointer"
                  onClick={() => onOpenSample(store)}
                >
                  <Package className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sample</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer"
                  onClick={() => onOpenFollowup(store)}
                >
                  <Calendar className="h-4 w-4" />
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
                  className="rounded-xs bg-card border-2 border-foreground/20 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-foreground/30 transition-all cursor-pointer"
                  onClick={() => onEdit(store)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* BOTTOM: Contacts & Due Info Container */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Contacts, Rep, Status */}
        <div className="flex-1 text-sm bg-muted/30 dark:bg-muted p-2 rounded-xs">
          {/* Rep Info */}
          {store.rep && (
            <div className="mb-2">
              <strong className="text-foreground">Rep:</strong>{" "}
              <span className="text-primary font-medium">
                {store.rep.name || store.rep}
              </span>
            </div>
          )}

          {/* Contact Info */}
          {Array.isArray(store?.contacts) && store.contacts.length > 0 ? (
            <div className="mb-2">
              <p className="font-semibold text-foreground mb-1">Contacts:</p>
              {store.contacts.map((c: any, idx: number) => (
                <div key={idx} className="pl-2 border-l-2 border-primary mb-1">
                  <div className="flex flex-wrap gap-2 text-foreground">
                    <span>
                      <strong className="text-primary">{c?.name}</strong>{" "}
                      {c?.role && (
                        <span className="text-muted-foreground">
                          ({c.role})
                        </span>
                      )}
                    </span>
                    {c?.email && (
                      <span className="text-muted-foreground">| {c.email}</span>
                    )}
                    {c?.phone && (
                      <span className="text-muted-foreground">| {c.phone}</span>
                    )}
                  </div>
                  {c?.importantToKnow && (
                    <div className="text-sm text-green-700 dark:text-green-400">
                      <strong>Important:</strong> {c.importantToKnow}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-2">
              No contacts available.
            </p>
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
        </div>

        {/* Due Amount */}
        {hasDue && (
          <div className="md:w-1/3">
            <div className="bg-muted/30 dark:bg-muted/20 p-3 rounded-xs">
              <div className={`text-sm font-medium ${paymentColor} text-right`}>
                Due: ${store.dueAmount.toLocaleString()}
                {store.lastPaidAt && (
                  <span className="block text-muted-foreground text-xs">
                    Last paid: {new Date(store.lastPaidAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
