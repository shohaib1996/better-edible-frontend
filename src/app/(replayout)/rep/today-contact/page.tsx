"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useGetAllDeliveriesQuery,
  useGetDeliveryOrderQuery,
  useSaveDeliveryOrderMutation,
} from "@/redux/api/Deliveries/deliveryApi";
import { useUser } from "@/redux/hooks/useAuth";
import {
  useGetRepByIdQuery,
  useCheckInRepMutation,
  useCheckOutRepMutation,
} from "@/redux/api/Rep/repApi";
import { toast } from "sonner";
import { useDebounced } from "@/redux/hooks/hooks";
import { format } from "date-fns";
import { useCreateOrderMutation } from "@/redux/api/orders/orders";
import { cn } from "@/lib/utils";
import { TodayContactHeader } from "@/components/pages/TodayContact/TodayContactHeader";
import { TodayContactControls } from "@/components/pages/TodayContact/TodayContactControls";
import { DeliveryList } from "@/components/pages/TodayContact/DeliveryList";
import { OrderModal } from "@/components/pages/TodayContact/OrderModal";
import type { Field } from "@/components/ReUsableComponents/EntityModal";
import { EditDeliveryModal } from "@/components/Delivery/EditDeliveryModal";
import type { Delivery } from "@/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

// ---------- COMPONENT ----------
const TodayContact = () => {
  const user = useUser();
  const { data: repData } = useGetRepByIdQuery(user?.id, {
    skip: !user?.id,
  });
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 500 });

  const [checkin, { isLoading: checkinLoading }] = useCheckInRepMutation();
  const [checkout, { isLoading: checkoutLoading }] = useCheckOutRepMutation();
  const [pin, setPin] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
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

  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  const {
    data: deliveriesData,
    isLoading,
    refetch,
  } = useGetAllDeliveriesQuery(
    {
      assignedTo: user?.id,
      startDate: date,
      endDate: date,
      storeName: debouncedSearch,
      limit: 100,
    },
    {
      skip: !user?.id || !date,
    }
  );

  const deliveries = deliveriesData?.deliveries || [];
  const [orderedDeliveries, setOrderedDeliveries] = useState<Delivery[]>([]);
  const prevDeliveriesRef = useRef<string>("");

  const { data: savedOrderData } = useGetDeliveryOrderQuery(
    { repId: user?.id!, date },
    { skip: !user?.id || !date }
  );
  const [saveDeliveryOrder] = useSaveDeliveryOrderMutation();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onOrderFormChange = useCallback((items: any[], totals: any) => {
    setOrderItems(items);
    setOrderTotals((prev) => ({ ...prev, ...totals }));
  }, []);

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

  const handleNewOrder = (delivery: Delivery) => {
    const initialData = {
      storeId: delivery.storeId?._id || "",
      store: delivery.storeId,
      repId: user?.id || "",
      deliveryDate: new Date().toISOString().split("T")[0],
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

  const handleEditDelivery = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setEditModalOpen(true);
  };

  const orderFields: Field[] = [
    {
      name: "storeId",
      label: "Store",
      render: (value, onChange, initialData) => (
        <div className="p-2 border border-border rounded-xs bg-secondary/30 dark:bg-secondary/10">
          <p className="font-semibold text-foreground">
            {initialData?.store?.name}
          </p>
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
        <div className="p-2 border border-border rounded-xs bg-secondary/30 dark:bg-secondary/10">
          <p className="font-semibold text-foreground">{user?.name}</p>
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
                format(new Date(value), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xs">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
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

  // 🔹 Load saved order from database (or default)
  useEffect(() => {
    const deliveriesStr = JSON.stringify(deliveries);

    // Only update if deliveries actually changed
    if (prevDeliveriesRef.current === deliveriesStr) {
      return;
    }

    prevDeliveriesRef.current = deliveriesStr;

    // Filter out completed and cancelled deliveries
    const activeDeliveries = deliveries.filter(
      (delivery: Delivery) =>
        delivery.status !== "completed" && delivery.status !== "cancelled"
    );

    const savedOrder = savedOrderData?.order;
    if (savedOrder?.length) {
      const sorted = [...activeDeliveries].sort(
        (a, b) => savedOrder.indexOf(a._id) - savedOrder.indexOf(b._id)
      );
      setOrderedDeliveries(sorted);
    } else {
      setOrderedDeliveries(activeDeliveries);
    }
  }, [deliveries, savedOrderData]);

  // 🔹 Move Up/Down & Save order to database (debounced)
  const moveDelivery = (index: number, direction: "up" | "down") => {
    setOrderedDeliveries((prev) => {
      const newList = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newList.length) return prev;
      [newList[index], newList[targetIndex]] = [
        newList[targetIndex],
        newList[index],
      ];

      // Debounce the save to avoid excessive API calls on rapid clicks
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (user?.id) {
          saveDeliveryOrder({
            repId: user.id,
            date,
            order: newList.map((d) => d._id),
          });
        }
      }, 500);

      return newList;
    });
  };

  // 🔹 Check-in / Check-out Logic
  const handleCheckInOrOut = async () => {
    if (!pin.trim() || !user) return;

    const action = repData?.checkin ? "checkout" : "checkin";

    try {
      if (action === "checkin") {
        await checkin({ loginName: user.loginName, pin }).unwrap();
        toast.success(`${user.name} checked in successfully`);
      } else {
        await checkout({ loginName: user.loginName, pin }).unwrap();
        toast.success(`${user.name} checked out successfully`);
      }
      setIsModalOpen(false);
      setPin("");
    } catch (error: any) {
      const actionName = action === "checkin" ? "in" : "out";
      toast.error(error?.data?.message || `Check ${actionName} failed`);
    }
  };

  return (
    <main className="min-h-screen bg-background p-0 md:p-5">
      <div className="container mx-auto space-y-3 md:space-y-6 px-3 md:px-4">
        <TodayContactHeader
          repData={repData}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          pin={pin}
          setPin={setPin}
          handleCheckInOrOut={handleCheckInOrOut}
          checkinLoading={checkinLoading}
          checkoutLoading={checkoutLoading}
        />
        <TodayContactControls
          date={date}
          setDate={setDate}
          search={search}
          setSearch={setSearch}
        />

        <DeliveryList
          isLoading={isLoading}
          orderedDeliveries={orderedDeliveries}
          moveDelivery={moveDelivery}
          handleNewOrder={handleNewOrder}
          handleEditDelivery={handleEditDelivery}
        />

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

        <EditDeliveryModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          delivery={editingDelivery}
          refetch={refetch}
        />
      </div>
    </main>
  );
};

export default TodayContact;
