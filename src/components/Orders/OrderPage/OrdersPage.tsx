"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useGetAllOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useChangeOrderStatusMutation,
} from "@/redux/api/orders/orders";
import { useUpdateSampleStatusMutation, useUpdateSampleMutation } from "@/redux/api/Samples/samplesApi ";
import {
  EntityModal,
  Field,
} from "@/components/ReUsableComponents/EntityModal";
import { OrderForm } from "@/components/Orders/OrderForm";
import { OrdersHeader } from "@/components/Orders/OrderPage/OrdersHeader";
import { OrdersFilters } from "@/components/Orders/OrderPage/OrdersFilters";
import { OrdersTabs } from "@/components/Orders/OrderPage/OrdersTabs";
import { useDebounced } from "@/redux/hooks/hooks";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { StoreSelect } from "@/components/Shared/StoreSelect";
import { RepSelect } from "@/components/Shared/RepSelect";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { IOrder, IRep } from "@/types";

const OrdersPage = ({
  isRepView = false,
  currentRepId,
  currentRep,
}: {
  isRepView?: boolean;
  currentRepId?: string;
  currentRep?: Partial<IRep> | null;
}) => {
  const [activeTab, setActiveTab] = useState(isRepView ? "all" : "new");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepName, setSelectedRepName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  // Pagination state for shipped orders
  const [shippedPage, setShippedPage] = useState(1);
  const [shippedLimit, setShippedLimit] = useState(10);

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
    repName: isRepView ? undefined : selectedRepName || undefined, // Only use selectedRepName if not rep view
    repId: isRepView
      ? (activeTab === "new" ? currentRepId : undefined) // Only filter by currentRepId for "new" tab
      : undefined, // Admin view doesn't filter by rep
    startDate,
    endDate,
    status:
      activeTab === "shipped"
        ? ["shipped", "cancelled"]
        : ["submitted", "accepted", "manifested"],
    // Add pagination for shipped orders
    page: activeTab === "shipped" ? shippedPage : 1,
    limit: activeTab === "shipped" ? shippedLimit : 999, // Use large limit for new orders
  });
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateOrderMutation();
  const [changeStatus] = useChangeOrderStatusMutation();
  const [updateSampleStatus] = useUpdateSampleStatusMutation();
  const [updateSample] = useUpdateSampleMutation();

  const orders: IOrder[] = data?.orders || [];
  const totalOrders = data?.total || 0; // Get total count from API response

  // ─────────────── GROUP ORDERS ───────────────
  const grouped = useMemo(() => {
    const allOrders = orders.filter(
      (o) => o.status !== "shipped" && o.status !== "cancelled"
    );
    const newOrders = orders.filter(
      (o) => o.status !== "shipped" && o.status !== "cancelled"
    );
    const shippedOrders = orders.filter(
      (o) => o.status === "shipped" || o.status === "cancelled"
    );
    return { allOrders, newOrders, shippedOrders };
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
      // Check if this is a sample by looking in the orders data
      const item = orders.find((o) => o._id === id);
      const isSample = (item as any)?.isSample === true;

      // If changing to "shipped"
      if (status === "shipped") {
        const today = format(new Date(), "yyyy-MM-dd");
        const updateData: any = { id };

        // Set delivery date to today if not already set, or use existing delivery date
        if (!item?.deliveryDate) {
          updateData.deliveryDate = today;
        }

        // Always set shippedDate to today when marking as shipped
        updateData.shippedDate = today;

        // Use the correct mutation based on whether it's a sample or order
        if (isSample) {
          await updateSample(updateData).unwrap();
        } else {
          await updateOrder(updateData).unwrap();
        }
      }

      if (isSample) {
        await updateSampleStatus({ id, status }).unwrap();
        toast.success(`Sample marked as ${status}`);
      } else {
        await changeStatus({ id, status }).unwrap();
        toast.success(`Order marked as ${status}`);
      }
      refetch();
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleFilter = ({
    startDate,
    endDate,
  }: {
    startDate?: string;
    endDate?: string;
  }) => {
    setStartDate(startDate);
    setEndDate(endDate);
  }; // Added comment to force re-evaluation

  // ✅ Fixed Edit Handler
  const openEdit = useCallback((order: any) => {
    const initialData = {
      _id: order._id,
      storeId: order.store?._id || "",
      store: order.store, // Add the full store object here
      repId: order.rep?._id || "",
      deliveryDate: order.deliveryDate
        ? format(new Date(order.deliveryDate), "yyyy-MM-dd")
        : "",
      note: order.note || "",
      discountType: order.discountType, // assuming backend doesn't send type, use default
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
      render: (value, onChange, initialData, setFieldValue) => (
        <StoreSelect
          value={value}
          onChange={onChange}
          initialStore={initialData?.store}
          onStoreSelect={(store) => {
            if (store?.rep && setFieldValue) {
              // Handle both populated full rep object or just ID
              const repId =
                typeof store.rep === "string" ? store.rep : store.rep._id;
              if (repId) {
                setFieldValue("repId", repId);
              }
            }
          }}
        />
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
          setEditingOrder({ repId: isRepView ? currentRepId : "" }); // Pre-fill repId if in rep view
          setModalOpen(true);
        }}
      />

      <OrdersFilters
        reps={reps}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRepName={selectedRepName}
        setSelectedRepName={setSelectedRepName}
        isRepView={isRepView} // Pass isRepView to OrdersFilters
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
        currentRep={currentRep}
        isRepView={isRepView}
        totalOrders={totalOrders}
        shippedPage={shippedPage}
        shippedLimit={shippedLimit}
        onShippedPageChange={setShippedPage}
        onShippedLimitChange={setShippedLimit}
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
