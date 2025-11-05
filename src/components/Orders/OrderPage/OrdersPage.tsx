"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  useGetAllOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useChangeOrderStatusMutation,
} from "@/src/redux/api/orders/orders";
import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import { OrderForm } from "@/src/components/Orders/OrderForm";
import { OrdersHeader } from "@/src/components/Orders/OrderPage/OrdersHeader";
import { OrdersFilters } from "@/src/components/Orders/OrderPage/OrdersFilters";
import { OrdersTabs } from "@/src/components/Orders/OrderPage/OrdersTabs";
import { useDebounced } from "@/src/redux/hooks/hooks";
import { useGetAllRepsQuery } from "@/src/redux/api/Rep/repApi";
import { StoreSelect } from "@/src/components/Shared/StoreSelect";
import { RepSelect } from "@/src/components/Shared/RepSelect";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { IOrder } from "@/src/types";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepName, setSelectedRepName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

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

  const debouncedSearch = useDebounced({ searchQuery: searchTerm, delay: 400 });
  const { data: reps } = useGetAllRepsQuery({});
  const { data, isLoading, refetch } = useGetAllOrdersQuery({
    search: debouncedSearch || undefined,
    repName: selectedRepName || undefined,
    startDate,
    endDate,
    status: activeTab === 'new' ? ['submitted', 'accepted', 'manifested'] : ['shipped', 'cancelled'],
  });
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateOrderMutation();
  const [changeStatus] = useChangeOrderStatusMutation();

  const orders: IOrder[] = data?.orders || [];

  // ─────────────── GROUP ORDERS ───────────────
  const grouped = useMemo(() => {
    const newOrders = orders.filter(
      (o) => o.status !== "shipped" && o.status !== "cancelled"
    );
    const shippedOrders = orders.filter(
      (o) => o.status === "shipped" || o.status === "cancelled"
    );
    return { newOrders, shippedOrders };
  }, [orders]);

  // ─────────────── HANDLERS ───────────────
  const onOrderFormChange = useCallback((items: any[], totals: any) => {
    setOrderItems(items);
    setOrderTotals((prev) => ({ ...prev, ...totals }));
  }, []);

  const handleCreateOrUpdate = async (values: any) => {
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

      if (editingOrder?._id) {
        await updateOrder({ id: editingOrder._id, ...orderData }).unwrap();
        toast.success("Order updated successfully");
      } else {
        await createOrder(orderData).unwrap();
        toast.success("Order created successfully");
      }
      setModalOpen(false);
      refetch();
    } catch {
      toast.error("Error saving order");
    }
  };

  const handleChangeStatus = async (id: string, status: string) => {
    try {
      await changeStatus({ id, status }).unwrap();
      refetch();
      toast.success(`Order marked as ${status}`);
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleFilter = ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    setStartDate(startDate);
    setEndDate(endDate);
  }; // Added comment to force re-evaluation

  // ✅ Fixed Edit Handler
  const openEdit = useCallback((order: any) => {
    console.log(order);
    const initialData = {
      _id: order._id,
      storeId: order.store?._id || "",
      repId: order.rep?._id || "",
      deliveryDate: order.deliveryDate
        ? format(new Date(order.deliveryDate), "yyyy-MM-dd")
        : "",
      note: order.note || "",
      discountType: "flat", // assuming backend doesn't send type, use default
      discountValue: order.discount || 0,
      subtotal: order.subtotal || 0,
      total: order.total || 0,

      // ✅ Map backend "items" to match what OrderForm expects
      items: order.items?.map((item: any) => ({
        product: item.product?._id || item.product, // not productId
        name: item.name || "",
        unitLabel: item.unitLabel || "",
        qty: item.qty || 0,
        discountPrice: item.discountPrice || item.unitPrice || 0,
        appliedDiscount: item.appliedDiscount, // Pass the appliedDiscount field
      })),
    };

    // ✅ Set all edit states
    setEditingOrder(initialData);
    setOrderItems(initialData.items);

    setOrderTotals({
      totalCases: initialData.items.reduce(
        (sum: number, i: any) => sum + (i.caseQuantity || 0),
        0
      ),
      totalPrice: initialData.subtotal || 0,
      discount: initialData.discountValue || 0,
      finalTotal: initialData.total || 0,
      discountType: initialData.discountType === "flat" ? "flat" : "percent",
      discountValue: initialData.discountValue,
      note: initialData.note,
    });

    setModalOpen(true);
  }, []);

  // ─────────────── FORM FIELDS ───────────────
  const orderFields: Field[] = [
    {
      name: "storeId",
      label: "Store",
      render: (value, onChange) => (
        <StoreSelect value={value} onChange={onChange} />
      ),
    },
    {
      name: "repId",
      label: "Rep",
      render: (value, onChange) => (
        <RepSelect value={value} onChange={onChange} />
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

  return (
    <div className="p-6 space-y-6">
      <OrdersHeader
        onNewOrder={() => {
          setEditingOrder(null);
          setModalOpen(true);
        }}
      />

      <OrdersFilters
        reps={reps}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRepName={selectedRepName}
        setSelectedRepName={setSelectedRepName}
      />

      <OrdersTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        grouped={grouped}
        handleChangeStatus={handleChangeStatus}
        updateOrder={updateOrder}
        isLoading={isLoading}
        refetch={refetch}
        onEdit={openEdit} // ✅ Pass down edit handler
        onFilter={handleFilter}
        reps={reps?.data || []}
      />

      <EntityModal
        key={editingOrder?._id || "new"} // ✅ Forces fresh modal on change
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        title={editingOrder?._id ? "Edit Order" : "Create Order"}
        fields={orderFields}
        initialData={editingOrder}
        isSubmitting={creating || updating}
      >
        <OrderForm
          initialItems={editingOrder?.items || []}
          initialDiscountType={editingOrder?.discountType || "flat"}
          initialDiscountValue={
            editingOrder?.discountValue ?? editingOrder?.discount
          }
          initialNote={editingOrder?.note || ""}
          onChange={onOrderFormChange}
        />
      </EntityModal>
    </div>
  );
};

export default OrdersPage;
