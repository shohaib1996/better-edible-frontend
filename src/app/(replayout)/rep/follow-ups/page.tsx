"use client";

import { useState, useCallback } from "react";
import { useGetAllFollowupsQuery } from "@/redux/api/Followups/followupsApi";
import { useUser } from "@/redux/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import type { IFollowUp } from "@/types";
import { useCreateOrderMutation } from "@/redux/api/orders/orders";
import { useDeleteFollowupMutation } from "@/redux/api/Followups/followupsApi";
import { OrderModal } from "@/components/pages/TodayContact/OrderModal";
import { Field } from "@/components/ReUsableComponents/EntityModal";
import { toast } from "sonner";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  Repeat,
  ShoppingCart,
  Truck,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

import { format, addDays, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";

/** Helper: convert a YYYY-MM-DD string (or Date) into a local Date at local midnight
 *  Returns null if invalid. This avoids timezone shifts when formatting/displaying.
 */
function toLocalDate(value?: string | Date | null): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const s = String(value);

  // If already "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Fallback: try Date parser then convert to local date (safe)
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

const FollowUps = () => {
  const user = useUser();

  // Local timezone date (used for calendar selection)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotals, setOrderTotals] = useState({
    totalCases: 0,
    totalPrice: 0,
    discount: 0,
    finalTotal: 0,
    discountType: "flat" as "flat" | "percent",
    discountValue: 0,
    note: "",
  });

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStoreForDelivery, setSelectedStoreForDelivery] = useState<
    IFollowUp["store"] | null
  >(null);
  const [selectedRepForDelivery, setSelectedRepForDelivery] = useState<
    IFollowUp["rep"] | null
  >(null);

  const [editFollowupModalOpen, setEditFollowupModalOpen] = useState(false);
  const [selectedFollowupForEdit, setSelectedFollowupForEdit] =
    useState<IFollowUp | null>(null);

  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();
  const [deleteFollowup] = useDeleteFollowupMutation();

  const onOrderFormChange = useCallback((items: any[], totals: any) => {
    setOrderItems(items);
    setOrderTotals((prev) => ({ ...prev, ...totals }));
  }, []);

  const handleEditFollowup = (followup: IFollowUp) => {
    setSelectedFollowupForEdit(followup);
    setEditFollowupModalOpen(true);
  };

  const handleDeleteFollowup = async (id: string) => {
    try {
      await deleteFollowup(id).unwrap();
      toast.success("Follow-up dismissed successfully");
    } catch (error) {
      toast.error("Failed to dismiss follow-up");
    }
  };

  const handleCreateOrder = async (values: any) => {
    try {
      const orderData = {
        ...values,
        items: orderItems,
        subtotal: orderTotals.totalPrice,
        discountType: orderTotals.discountType,
        discountValue: orderTotals.discountValue,
        total: orderTotals.finalTotal,
        note: orderTotals.note,
      };

      await createOrder(orderData).unwrap();
      toast.success("Order created successfully");
      setModalOpen(false);
    } catch {
      toast.error("Error saving order");
    }
  };

  const handleNewOrder = (followup: IFollowUp) => {
    const initialData = {
      storeId: followup.store?._id || "",
      store: followup.store,
      repId: user?.id || "",
      deliveryDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      items: [],
      note: "",
      discountType: "flat",
      discountValue: 0,
      subtotal: 0,
      total: 0,
    };
    setEditingOrder(initialData);
    setOrderItems([]);
    setOrderTotals({
      totalCases: 0,
      totalPrice: 0,
      discount: 0,
      finalTotal: 0,
      discountType: "flat",
      discountValue: 0,
      note: "",
    });
    setModalOpen(true);
  };

  const handleDelivery = (followup: IFollowUp) => {
    setSelectedStoreForDelivery(followup.store);
    setSelectedRepForDelivery(followup.rep);
    setDeliveryModalOpen(true);
  };

  const handleClearDate = () => {
    setShowAll(true);
    setSearch("");
  };

  const handleReset = () => {
    setSearch("");
    setShowAll(false);
    setSelectedDate(new Date());
  };

  const showReset =
    search ||
    showAll ||
    selectedDate.toDateString() !== new Date().toDateString();

  const orderFields: Field[] = [
    {
      name: "storeId",
      label: "Store",
      render: (value, onChange, initialData) => (
        <div className="p-2 border rounded-xs bg-muted">
          <p className="font-semibold">{initialData?.store?.name}</p>
          <p className="text-sm text-muted-foreground">
            {initialData?.store?.address}
          </p>
        </div>
      ),
    },
    {
      name: "repId",
      label: "Rep",
      render: (value, onChange) => (
        <div className="p-2 border rounded-xs bg-muted">
          <p className="font-semibold">{user?.name}</p>
        </div>
      ),
    },
    {
      name: "deliveryDate",
      label: "Delivery Date",
      render: (value, onChange) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal rounded-xs",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? (
                format(toLocalDate(value) as Date, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xs">
            <Calendar
              mode="single"
              selected={value ? toLocalDate(value) || undefined : undefined}
              onSelect={(date) =>
                onChange(date ? format(date, "yyyy-MM-dd") : "")
              }
              initialFocus
              className="rounded-xs"
            />
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  const debouncedSearch = useDebounce(search, 500);

  // <-- IMPORTANT: send yyyy-MM-dd string to backend (date-only)
  const { data, isLoading } = useGetAllFollowupsQuery({
    repId: user?.id,
    date: showAll ? undefined : format(selectedDate, "yyyy-MM-dd"),
    storeName: debouncedSearch,
  });

  const followups: IFollowUp[] = data?.followups || [];

  const goPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading follow-ups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Repeat className="h-6 w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Follow Ups
        </h1>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-xs border border-border bg-card dark:bg-card max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {/* Date Navigation */}
          <div className="flex items-center gap-1 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrevDay}
              disabled={showAll}
              className="h-9 w-9 shrink-0 rounded-xs border border-gray-300 dark:border-gray-600 bg-background hover:bg-accent hover:text-accent-foreground dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={showAll}
                  className={cn(
                    "flex-1 justify-start text-left font-normal rounded-xs h-9 min-w-0 dark:hover:bg-secondary border dark:border-border",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {selectedDate
                      ? format(selectedDate, "MMM dd, yyyy")
                      : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                  className="rounded-xs"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={goNextDay}
              disabled={showAll}
              className="h-9 w-9 shrink-0 rounded-xs border border-gray-300 dark:border-gray-600 bg-background hover:bg-accent hover:text-accent-foreground dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleClearDate}
              className="h-9 w-9 shrink-0 rounded-xs border border-gray-300 dark:border-gray-600 bg-background hover:bg-accent hover:text-accent-foreground dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
              title="View all follow-ups"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-0 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by store name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xs h-9 w-full"
            />
          </div>

          {/* Reset Button */}
          {showReset && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-xs h-9 gap-1 md:col-span-3"
            >
              <X className="h-4 w-4" />
              <span>Reset All Filters</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Followups List */}
      <div className="space-y-3">
        {followups.length === 0 ? (
          <Card className="p-6 rounded-xs text-center border-border">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No follow-ups found.
              </p>
            </div>
          </Card>
        ) : (
          followups.map((f) => {
            const dateStr = (f as any).followupDate as string | undefined;
            const local = toLocalDate(dateStr);

            const today = new Date();
            const delay = local
              ? Math.max(0, differenceInCalendarDays(today, local))
              : 0;
            const borderColorClass =
              delay > 0
                ? "border-l-red-500 dark:border-l-red-600"
                : "border-l-emerald-500 dark:border-l-emerald-600";

            return (
              <Card
                key={f._id}
                className={`border-l-4 py-0 ${borderColorClass} rounded-xs shadow-sm`}
              >
                <CardContent className="p-4 flex flex-col gap-3">
                  {/* TOP ROW */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        {f.store.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {f.store.address}
                      </p>

                      <p className="text-muted-foreground text-sm mt-1">
                        Rep:{" "}
                        <span className="font-medium text-primary">
                          {f.rep.name}
                        </span>
                      </p>

                      <p className="text-muted-foreground text-sm">
                        Followup:{" "}
                        <span className="font-medium">
                          {dateStr && local
                            ? format(local, "MMM dd, yyyy")
                            : "No date"}
                        </span>
                      </p>

                      {/* Delay Info */}
                      {delay > 0 && (
                        <p className="text-red-600 dark:text-red-500 font-semibold text-sm mt-1">
                          Delayed by {delay} day{delay > 1 ? "s" : ""}
                        </p>
                      )}

                      {f.comments && (
                        <p className="text-foreground mt-2 text-sm">
                          {f.comments}
                        </p>
                      )}
                    </div>

                    <ConfirmDialog
                      triggerText="Dismiss"
                      title="Are you sure you want to dismiss this follow-up?"
                      description="This action cannot be undone."
                      onConfirm={() => handleDeleteFollowup(f._id)}
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelivery(f)}
                      className="rounded-xs border-input hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                    >
                      <Truck className="w-4 h-4 mr-1" /> Delivery
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xs border-input hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-1" /> Email
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNewOrder(f)}
                      className="rounded-xs border-input hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" /> Orders
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditFollowup(f)}
                      className="rounded-xs border-input hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:text-gray-200 dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors"
                    >
                      <Repeat className="w-4 mr-1" /> Re Followup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <OrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrder}
        title="Create Order"
        fields={orderFields}
        initialData={editingOrder}
        isSubmitting={creating}
        initialItems={editingOrder?.items || []}
        initialDiscountType={editingOrder?.discountType || "flat"}
        initialDiscountValue={
          editingOrder?.discountValue ?? editingOrder?.discount
        }
        initialNote={editingOrder?.note || ""}
        onOrderFormChange={onOrderFormChange}
      />

      <DeliveryModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        store={selectedStoreForDelivery}
        rep={selectedRepForDelivery}
      />

      <ManageFollowUpModal
        open={editFollowupModalOpen}
        onClose={() => setEditFollowupModalOpen(false)}
        followup={selectedFollowupForEdit}
      />
    </div>
  );
};

export default FollowUps;
