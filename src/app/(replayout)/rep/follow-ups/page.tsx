"use client";

import { useState, useCallback } from "react";
import { useGetAllFollowupsQuery } from "@/redux/api/Followups/followupsApi";
import { useUser } from "@/redux/hooks/useAuth";
import { useDebounced } from "@/redux/hooks/hooks";
import { IFollowUp } from "@/types";
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

  const orderFields: Field[] = [
    {
      name: "storeId",
      label: "Store",
      render: (value, onChange, initialData) => (
        <div className="p-2 border rounded-md bg-gray-50">
          <p className="font-semibold">{initialData?.store?.name}</p>
          <p className="text-sm text-gray-500">{initialData?.store?.address}</p>
        </div>
      ),
    },
    {
      name: "repId",
      label: "Rep",
      render: (value, onChange) => (
        <div className="p-2 border rounded-md bg-gray-50">
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
                "w-full justify-start text-left font-normal",
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
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? toLocalDate(value) || undefined : undefined}
              onSelect={(date) =>
                onChange(date ? format(date, "yyyy-MM-dd") : "")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  const debouncedSearch = useDebounced({ searchQuery: search, delay: 500 });

  // <-- IMPORTANT: send yyyy-MM-dd string to backend (date-only)
  const { data, isLoading } = useGetAllFollowupsQuery({
    repId: user?.id,
    date: showAll ? undefined : format(selectedDate, "yyyy-MM-dd"),
    storeName: debouncedSearch,
  });

  const followups: IFollowUp[] = data?.followups || [];

  const goPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  if (isLoading) return <p className="p-4 text-gray-500">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* ------------------- HEADER ------------------- */}
      <h1 className="text-2xl font-semibold">Follow Ups</h1>

      {/* ------------------- FILTERS ------------------- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Prev Button */}
          <Button variant="outline" onClick={goPrevDay}>
            <ChevronLeft />
          </Button>

          {/* Calendar Popover */}
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-44 flex justify-between",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled={showAll}
              >
                {selectedDate
                  ? format(selectedDate, "MMMM dd, yyyy")
                  : "Pick date"}
                <CalendarIcon className="w-4 h-4 opacity-70" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Next Button */}
          <Button variant="outline" onClick={goNextDay}>
            <ChevronRight />
          </Button>

          {/* Search */}
          <Input
            placeholder="Search stores..."
            className="max-w-xs border-2 border-emerald-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* View All */}
          <div className="flex items-center gap-2 ml-auto">
            <Checkbox
              id="viewAll"
              checked={showAll}
              className="border-2 border-emerald-500"
              onCheckedChange={(v) => {
                setShowAll(Boolean(v));
                if (Boolean(v)) {
                  setSearch("");
                }
              }}
            />
            <label htmlFor="viewAll" className="text-sm">
              View All
            </label>
          </div>
        </div>
      </Card>

      {/* ------------------- LIST ------------------- */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Followups</h2>

        {followups.length === 0 && (
          <p className="text-gray-500 text-sm">No followups found.</p>
        )}

        {followups.map((f) => {
          const dateStr = (f as any).followupDate as string | undefined;
          const local = toLocalDate(dateStr);

          const today = new Date();
          const delay = local
            ? Math.max(0, differenceInCalendarDays(today, local))
            : 0;
          const borderColorClass =
            delay > 0 ? "border-red-500" : "border-emerald-500";

          return (
            <Card
              key={f._id}
              className={`border-l-4 ${borderColorClass} shadow-sm py-0`}
            >
              <CardContent className="p-4 flex flex-col gap-2">
                {/* TOP ROW */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{f.store.name}</h3>
                    <p className="text-gray-600 text-sm">{f.store.address}</p>

                    <p className="text-gray-600 text-sm">
                      Rep: <span className="font-medium">{f.rep.name}</span>
                    </p>

                    <p className="text-gray-500 text-sm">
                      Followup:{" "}
                      {dateStr && local
                        ? format(local, "MMM dd, yyyy")
                        : "No date"}
                    </p>

                    {/* Delay Info */}
                    {delay > 0 && (
                      <p className="text-red-600 font-semibold text-sm">
                        Delayed by {delay} day{delay > 1 ? "s" : ""}
                      </p>
                    )}

                    <p className="text-gray-700 mt-1">{f.comments}</p>
                  </div>

                  <ConfirmDialog
                    triggerText="Dismiss"
                    title="Are you sure you want to dismiss this follow-up?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteFollowup(f._id)}
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDelivery(f)}
                  >
                    <Truck className="w-4 h-4 mr-1" /> Delivery
                  </Button>

                  <Button size="sm" variant="secondary">
                    <Mail className="w-4 h-4 mr-1" /> Email
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleNewOrder(f)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" /> Orders
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditFollowup(f)}
                  >
                    <Repeat className="w-4 h-4 mr-1" /> Re Followup
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
