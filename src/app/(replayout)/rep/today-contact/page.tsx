"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGetAllDeliveriesQuery } from "@/src/redux/api/Deliveries/deliveryApi";
import { useUser } from "@/src/redux/hooks/useAuth";
import {
  useGetRepByIdQuery,
  useCheckInRepMutation,
  useCheckOutRepMutation,
} from "@/src/redux/api/Rep/repApi";
import { toast } from "sonner";
import { useDebounced } from "@/src/redux/hooks/hooks";
import { format } from "date-fns";
import { useCreateOrderMutation } from "@/src/redux/api/orders/orders";
import { StoreSelect } from "@/src/components/Shared/StoreSelect";
import { RepSelect } from "@/src/components/Shared/RepSelect";
import { cn } from "@/src/lib/utils";
import { TodayContactHeader } from "@/src/components/pages/TodayContact/TodayContactHeader";
import { TodayContactControls } from "@/src/components/pages/TodayContact/TodayContactControls";
import { DeliveryList } from "@/src/components/pages/TodayContact/DeliveryList";
import { OrderModal } from "@/src/components/pages/TodayContact/OrderModal";
import { Field } from "@/src/components/ReUsableComponents/EntityModal";
import { EditDeliveryModal } from "@/src/components/Delivery/EditDeliveryModal";
import { Delivery } from "@/src/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { Button } from "@/src/components/ui/button";
import { CalendarIcon } from "lucide-react";

// ---------- COMPONENT ----------
const EXPIRATION_DAYS = 7;
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
  const [password, setPassword] = useState("");
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
  const ORDER_STORAGE_KEY = `delivery_order_${user?.id}_${date}`;

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
                format(new Date(value), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
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

  // 🔹 Cleanup old localStorage entries (runs once per mount)
  useEffect(() => {
    const now = Date.now();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("delivery_order_")) {
        try {
          const stored = JSON.parse(localStorage.getItem(key)!);
          if (stored?.savedAt) {
            const savedTime = new Date(stored.savedAt).getTime();
            const ageInDays = (now - savedTime) / (1000 * 60 * 60 * 24);
            if (ageInDays > EXPIRATION_DAYS) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Ignore bad JSON data
        }
      }
    });
  }, []);

  // 🔹 Load saved order from localStorage (or default)
  useEffect(() => {
    const deliveriesStr = JSON.stringify(deliveries);

    // Only update if deliveries actually changed
    if (prevDeliveriesRef.current === deliveriesStr) {
      return;
    }

    prevDeliveriesRef.current = deliveriesStr;

    // Filter out completed deliveries
    const activeDeliveries = deliveries.filter(
      (delivery: Delivery) => delivery.status !== "completed"
    );

    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const { order } = JSON.parse(stored);
        const sorted = [...activeDeliveries].sort(
          (a, b) => order.indexOf(a._id) - order.indexOf(b._id)
        );
        setOrderedDeliveries(sorted);
      } catch {
        setOrderedDeliveries(activeDeliveries);
      }
    } else {
      setOrderedDeliveries(activeDeliveries);
    }
  }, [deliveries, ORDER_STORAGE_KEY]);

  // 🔹 Move Up/Down & Save order with timestamp
  const moveDelivery = (index: number, direction: "up" | "down") => {
    setOrderedDeliveries((prev) => {
      const newList = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newList.length) return prev;

      [newList[index], newList[targetIndex]] = [
        newList[targetIndex],
        newList[index],
      ];

      localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          order: newList.map((d) => d._id),
        })
      );

      return newList;
    });
  };

  // 🔹 Check-in / Check-out Logic
  const handleCheckInOrOut = async () => {
    if (!password.trim() || !user) return;

    const action = repData?.checkin ? "checkout" : "checkin";

    try {
      if (action === "checkin") {
        await checkin({ loginName: user.loginName, password }).unwrap();
        toast.success(`${user.name} checked in successfully`);
      } else {
        await checkout({ loginName: user.loginName, password }).unwrap();
        toast.success(`${user.name} checked out successfully`);
      }
      setIsModalOpen(false);
      setPassword("");
    } catch {
      const actionName = action === "checkin" ? "in" : "out";
      toast.error(`Check ${actionName} failed`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-5">
      <div className="container mx-auto space-y-6">
        <TodayContactHeader
          repData={repData}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          password={password}
          setPassword={setPassword}
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
