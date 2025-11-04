"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  useGetAllOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useChangeOrderStatusMutation,
} from "@/src/redux/api/orders/orders";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Search } from "lucide-react";
import { OrderForm } from "@/src/components/Orders/OrderForm";
import { RepSelect } from "@/src/components/Shared/RepSelect";
import { StoreSelect } from "@/src/components/Shared/StoreSelect";
import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import { useDebounced } from "@/src/redux/hooks/hooks";
import { IOrder, IRep } from "@/src/types";
import { useGetAllRepsQuery } from "@/src/redux/api/Rep/repApi";
import { toast } from "sonner";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("accepted");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepName, setSelectedRepName] = useState(""); // ✅ new state
  const { data: reps, isLoading: repLoading } = useGetAllRepsQuery({});

  const debouncedSearch = useDebounced({ searchQuery: searchTerm, delay: 400 });

  const { data, isLoading, refetch } = useGetAllOrdersQuery({
    status: activeTab,
    search: debouncedSearch || undefined,
    repName: selectedRepName || undefined, // ✅ send to backend
  });

  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateOrderMutation();
  const [changeStatus] = useChangeOrderStatusMutation();

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
  });

  const orders: IOrder[] = data?.orders || [];

  // ─────────────────────────────
  // GROUP & CALCULATE
  // ─────────────────────────────
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const order of orders) {
      if (!map[order.status]) map[order.status] = [];
      map[order.status].push(order);
    }
    return map;
  }, [orders]);

  const totalByStatus = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const status in grouped) {
      totals[status] = grouped[status].reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );
    }
    return totals;
  }, [grouped]);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // ─────────────────────────────
  // FORM CHANGE HANDLER
  // ─────────────────────────────
  const onOrderFormChange = useCallback(
    (items: any[], totals: { totalCases: number; totalPrice: number }) => {
      setOrderItems(items);
      setOrderTotals((prev) => ({
        ...prev,
        ...totals,
      }));
    },
    []
  );

  // ─────────────────────────────
  // CREATE / UPDATE ORDER
  // ─────────────────────────────
  const handleCreateOrUpdate = async (values: any) => {
    try {
      const orderData = {
        ...values,
        items: orderItems,
        subtotal: orderTotals.totalPrice,
        discountType: orderTotals.discountType,
        discountValue: orderTotals.discountValue,
        total: orderTotals.finalTotal,
      };

      if (editingOrder?._id) {
        await updateOrder({ id: editingOrder._id, ...orderData }).unwrap();
        toast.success("Order updated successfully")
      } else {
        await createOrder(orderData).unwrap();
        toast.success("Order created successfully")
      }
      setModalOpen(false);
      refetch();
    } catch (error) {
      console.error(error);
      // alert("Error saving order");
      toast.error("Error saving order")
    }
  };

  // ─────────────────────────────
  // STATUS CHANGE
  // ─────────────────────────────
  const handleChangeStatus = async (id: string, status: string) => {
    try {
      await changeStatus({ id, status }).unwrap();
      refetch();
    } catch {
      alert("Error updating status");
    }
  };

  // ─────────────────────────────
  // ORDER FIELDS
  // ─────────────────────────────
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
    { name: "note", label: "Note" },
    {
      name: "deliveryDate",
      label: "Delivery Date",
      render: (value, onChange) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
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

  const statuses = [
    "draft",
    "submitted",
    "accepted",
    "manifested",
    "shipped",
    "cancelled",
  ];

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Orders Management</h1>
        <Button
          onClick={() => {
            setEditingOrder(null);
            setModalOpen(true);
          }}
        >
          + New Order
        </Button>
      </div>

      {/* ✅ Rep Filter + Search */}
      {[
        "accepted",
        "shipped",
        "draft",
        "submitted",
        "manifested",
        "cancelled",
      ].includes(activeTab) && (
        <div className="flex flex-wrap gap-3 items-center justify-end mb-3">
          {/* ✅ Rep Filter Dropdown */}
          <div className="">
            <Select
              value={selectedRepName || "all"}
              onValueChange={(value) =>
                setSelectedRepName(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {[
                  ...new Set(
                    reps?.data?.map((r: IRep) => r.name).filter(Boolean)
                  ),
                ].map((repName) => (
                  <SelectItem key={repName as string} value={repName as string}>
                    {repName as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-full border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            setSearchTerm("");
            setSelectedRepName("");
          }}
          className="space-y-4"
        >
          <TabsList className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <TabsTrigger key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {statuses.map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {grouped[status]?.length > 0 && (
                <div className="text-right font-semibold text-emerald-600 pr-2">
                  Total {status} Orders Value: $
                  {totalByStatus[status].toFixed(2)}
                </div>
              )}

              {grouped[status]?.length ? (
                grouped[status].map((order) => (
                  <Card
                    key={order._id}
                    className="flex flex-col md:flex-row justify-between items-center p-4 border hover:shadow-sm transition"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                      <div className="flex-1">
                        <h2 className="font-semibold text-lg">
                          Order #{order.orderNumber}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Store:{" "}
                          <span className="font-medium">
                            {order.store?.name || "N/A"}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Rep:{" "}
                          <span className="font-medium">
                            {order.rep?.name || "N/A"}
                          </span>
                        </p>
                        {order.deliveryDate && (
                          <p className="text-sm text-gray-500">
                            Delivery Date:{" "}
                            <span className="font-medium">
                              {new Date(
                                order.deliveryDate
                              ).toLocaleDateString()}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="font-semibold text-base">
                            ${order.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {order.status}
                          </p>
                        </div>

                        <Select
                          value={order.status}
                          onValueChange={(value) => {
                            if (value !== order.status)
                              handleChangeStatus(order._id, value);
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const initialData = {
                                ...order,
                                storeId: order.store?._id,
                                repId: order.rep?._id,
                                deliveryDate: order.deliveryDate
                                  ? format(
                                      new Date(order.deliveryDate),
                                      "yyyy-MM-dd"
                                    )
                                  : undefined,
                              };
                              setEditingOrder(initialData);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 mt-4">No {status} orders found.</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Modal for Create/Edit Order */}
      {isClient && (
        <EntityModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
          title={editingOrder?._id ? "Edit Order" : "Create Order"}
          fields={orderFields}
          initialData={editingOrder}
          isSubmitting={creating || updating}
        >
          <OrderForm
            initialItems={editingOrder?.items}
            initialDiscountType={editingOrder?.discountType || "flat"}
            initialDiscountValue={
              editingOrder?.discountValue ?? editingOrder?.discount
            }
            onChange={onOrderFormChange}
          />
        </EntityModal>
      )}
    </div>
  );
};

export default OrdersPage;