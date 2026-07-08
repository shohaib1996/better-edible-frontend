"use client";

import { useState } from "react";
import { Truck, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGetAllDeliveriesQuery, useGetDeliveryOrderQuery } from "@/redux/api/Deliveries/deliveryApi";
import type { Delivery } from "@/types/delivery/delivery";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { DeliveryFilters } from "@/components/Delivery/DeliveryFilters";
import { buildDeliveryColumns } from "@/components/Delivery/DeliveryColumns";
import { PaymentCollectedCell, DeliveryNoteCell } from "@/components/Delivery/DeliveryCells";

function statusStyle(status: string) {
  switch (status) {
    case "pending":    return "bg-yellow-500 text-white";
    case "assigned":   return "bg-blue-500 text-white";
    case "in_transit": return "bg-purple-500 text-white";
    case "completed":  return "bg-emerald-500 text-white";
    case "cancelled":  return "bg-red-500 text-white";
    default:           return "bg-gray-500 text-white";
  }
}

const todayLocal = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export default function DeliveriesContent() {
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedRep, setSelectedRep] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>(todayLocal());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const debouncedStoreName = useDebounce(storeName, 500);

  const queryParams: any = { page: currentPage, limit: itemsPerPage };
  if (debouncedStoreName) queryParams.storeName = debouncedStoreName;
  if (status !== "all") queryParams.status = status;
  if (selectedRep !== "all") queryParams.assignedTo = selectedRep;
  if (date) {
    queryParams.startDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)).toISOString();
    queryParams.endDate   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)).toISOString();
  }

  const { data, isLoading, isError } = useGetAllDeliveriesQuery(queryParams);

  const dateStr = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";

  const { data: deliveryOrderData } = useGetDeliveryOrderQuery(
    { repId: selectedRep, date: dateStr },
    { skip: !selectedRep || selectedRep === "all" || !dateStr }
  );

  const rawDeliveries: Delivery[] = data?.deliveries || [];

  const sortedDeliveries: Delivery[] = (() => {
    const stopOrder: string[] = deliveryOrderData?.order || [];
    if (!stopOrder.length) return rawDeliveries;
    const indexed = new Map(stopOrder.map((id, i) => [id, i]));
    return [...rawDeliveries].sort((a, b) => {
      const ai = indexed.has(a._id) ? indexed.get(a._id)! : 9999;
      const bi = indexed.has(b._id) ? indexed.get(b._id)! : 9999;
      return ai - bi;
    });
  })();

  const deliveries: Delivery[] =
    dispositionFilter === "all"
      ? sortedDeliveries
      : sortedDeliveries.filter((d) => {
          const disp = Array.isArray(d.disposition) ? d.disposition : [d.disposition];
          return disp.includes(dispositionFilter as Delivery["disposition"]);
        });

  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const today = todayLocal();
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const showReset =
    !!storeName ||
    status !== "all" ||
    selectedRep !== "all" ||
    dispositionFilter !== "all" ||
    (date ? toLocalDateStr(date) !== toLocalDateStr(today) : false);

  function handlePrevDay() {
    if (!date) return;
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
    setCurrentPage(1);
  }

  function handleNextDay() {
    if (!date) return;
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
    setCurrentPage(1);
  }

  function handleReset() {
    setStoreName("");
    setStatus("all");
    setSelectedRep("all");
    setDispositionFilter("all");
    setDate(todayLocal());
    setCurrentPage(1);
  }

  const columns = buildDeliveryColumns(currentPage, itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading deliveries...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        Error loading deliveries.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="h-6 w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Deliveries Management</h1>
      </div>

      <DeliveryFilters
        storeName={storeName}
        status={status}
        selectedRep={selectedRep}
        dispositionFilter={dispositionFilter}
        date={date}
        showReset={showReset}
        onStoreNameChange={(v) => { setStoreName(v); setCurrentPage(1); }}
        onStatusChange={(v) => { setStatus(v); setCurrentPage(1); }}
        onRepChange={(v) => { setSelectedRep(v); setCurrentPage(1); }}
        onDispositionChange={(v) => { setDispositionFilter(v); setCurrentPage(1); }}
        onDateChange={(d) => { setDate(d); setCurrentPage(1); }}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onReset={handleReset}
      />

      {deliveries.length === 0 ? (
        <Card className="p-6 rounded-xs text-center border-border">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No deliveries found.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop table */}
          <div className="hidden md:block">
            <DataTable columns={columns} data={deliveries} />
          </div>

          {/* Mobile / tablet cards */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {deliveries.map((delivery, index) => {
              const dispositions: string[] = Array.isArray(delivery.disposition)
                ? delivery.disposition
                : [delivery.disposition];
              return (
                <div
                  key={delivery._id}
                  className="rounded-xs border border-border bg-card p-4 flex flex-col gap-3"
                >
                  {/* Header: index + status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      #{(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xs px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusStyle(delivery.status)
                      )}
                    >
                      {delivery.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Store */}
                  <div>
                    <p className="font-semibold text-foreground leading-tight">
                      {delivery.storeId?.name || "N/A"}
                    </p>
                    {delivery.storeId?.address && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {delivery.storeId.address}
                        {delivery.storeId.city && `, ${delivery.storeId.city}`}
                      </p>
                    )}
                  </div>

                  {/* Rep */}
                  <p className="text-sm text-primary font-medium">
                    {delivery.assignedTo?.name || "Unassigned"}
                  </p>

                  {/* Disposition + amount */}
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium text-foreground capitalize">
                      {dispositions.map((d) => d.replace(/_/g, " ")).join(", ")}
                    </p>
                    <p className="text-muted-foreground capitalize">
                      {delivery.paymentAction?.replace(/_/g, " ")}
                    </p>
                    <p className="text-primary font-semibold">${delivery.amount?.toFixed(2)}</p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0 w-24">Payment:</span>
                      <PaymentCollectedCell deliveryId={delivery._id} />
                    </div>
                    {delivery.notes && (
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground shrink-0 w-24">Admin note:</span>
                        <span className="text-foreground">{delivery.notes}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0 w-24">Rep note:</span>
                      <DeliveryNoteCell deliveryId={delivery._id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <GlobalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={(l) => { setItemsPerPage(l); setCurrentPage(1); }}
            limitOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
