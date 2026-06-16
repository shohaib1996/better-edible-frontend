"use client";

import { useState } from "react";
import { Truck, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useGetAllDeliveriesQuery, useGetDeliveryOrderQuery } from "@/redux/api/Deliveries/deliveryApi";
import type { Delivery } from "@/types/delivery/delivery";
import { useDebounce } from "@/hooks/useDebounce";
import { DataTable } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { DeliveryFilters } from "@/components/Delivery/DeliveryFilters";
import { buildDeliveryColumns } from "@/components/Delivery/DeliveryColumns";
import { DeliveryMobileCard } from "@/components/Delivery/DeliveryMobileCard";

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

  // Fetch route order when a specific rep is selected
  const { data: deliveryOrderData } = useGetDeliveryOrderQuery(
    { repId: selectedRep, date: dateStr },
    { skip: !selectedRep || selectedRep === "all" || !dateStr }
  );

  const rawDeliveries: Delivery[] = data?.deliveries || [];

  // Build a stop-order map: deliveryId → 1-based stop number
  const stopOrder: string[] = deliveryOrderData?.order || [];
  const stopOrderMap = new Map<string, number>(
    stopOrder.map((id, i) => [id, i + 1])
  );

  // Sort by route order when a rep is selected
  const sortedDeliveries: Delivery[] = (() => {
    if (!stopOrder.length) return rawDeliveries;
    return [...rawDeliveries].sort((a, b) => {
      const ai = stopOrderMap.has(a._id) ? stopOrderMap.get(a._id)! : 9999;
      const bi = stopOrderMap.has(b._id) ? stopOrderMap.get(b._id)! : 9999;
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

  const columns = buildDeliveryColumns(currentPage, itemsPerPage, stopOrderMap.size > 0 ? stopOrderMap : undefined);

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
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {deliveries.map((delivery, i) => (
              <DeliveryMobileCard
                key={delivery._id}
                delivery={delivery}
                index={(currentPage - 1) * itemsPerPage + i + 1}
                stopNumber={stopOrderMap.get(delivery._id)}
              />
            ))}
          </div>
          {/* Desktop: data table */}
          <div className="hidden md:block">
            <DataTable columns={columns} data={deliveries} />
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
