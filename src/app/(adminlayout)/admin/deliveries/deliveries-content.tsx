"use client";

import { useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Truck,
  Search,
  X,
  ClipboardList,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetAllDeliveriesQuery } from "@/redux/api/Deliveries/deliveryApi";
import type { Delivery } from "@/types/delivery/delivery";
import { useDebounce } from "@/hooks/useDebounce";
import { RepSelect } from "@/components/Shared/RepSelect";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";

export default function DeliveriesContent() {
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState<string>("in_transit");
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const debouncedStoreName = useDebounce(storeName, 500);

  const queryParams: any = {
    page: currentPage,
    limit: itemsPerPage,
  };

  if (debouncedStoreName) queryParams.storeName = debouncedStoreName;
  if (status && status !== "all") queryParams.status = status;
  if (selectedRep && selectedRep !== "all")
    queryParams.assignedTo = selectedRep;
  if (date) {
    queryParams.startDate = startOfDay(date).toISOString();
    queryParams.endDate = endOfDay(date).toISOString();
  }

  const { data, isLoading, isError } = useGetAllDeliveriesQuery(queryParams);

  const deliveries: Delivery[] = data?.deliveries || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white dark:bg-yellow-600";
      case "assigned":
        return "bg-blue-500 text-white dark:bg-blue-600";
      case "in_transit":
        return "bg-purple-500 text-white dark:bg-purple-600";
      case "completed":
        return "bg-emerald-500 text-white dark:bg-emerald-600";
      case "cancelled":
        return "bg-red-500 text-white dark:bg-red-600";
      default:
        return "bg-gray-500 text-white dark:bg-gray-600";
    }
  };

  const handlePrevDay = () => {
    if (date) {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - 1);
      setDate(newDate);
      setCurrentPage(1);
    }
  };

  const handleNextDay = () => {
    if (date) {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 1);
      setDate(newDate);
      setCurrentPage(1);
    }
  };

  const handleReset = () => {
    setStoreName("");
    setStatus("in_transit");
    setSelectedRep("all");
    setDate(new Date());
    setCurrentPage(1);
  };

  const showReset =
    storeName ||
    status !== "in_transit" ||
    selectedRep !== "all" ||
    date?.toDateString() !== new Date().toDateString();

  const columns: Column<Delivery>[] = [
    {
      key: "storeId",
      header: "Store",
      className: "min-w-[200px]",
      render: (delivery) => (
        <div className="flex flex-col">
          {/* Desktop: Tooltip on hover */}
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer">
                    <div className="font-semibold text-foreground truncate max-w-[200px]">
                      {delivery.storeId?.name || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {delivery.storeId?.address}
                      {delivery.storeId?.city && `, ${delivery.storeId.city}`}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xs max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {delivery.storeId?.name || "N/A"}
                    </p>
                    <p className="text-xs">
                      {delivery.storeId?.address}
                      {delivery.storeId?.city && `, ${delivery.storeId.city}`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Mobile: Show wrapped text */}
          <div className="md:hidden">
            <div className="font-semibold text-foreground wrap-break-word whitespace-normal max-w-[250px]">
              {delivery.storeId?.name || "N/A"}
            </div>
            <div className="text-sm text-muted-foreground break-break-word whitespace-normal max-w-[250px]">
              {delivery.storeId?.address}
              {delivery.storeId?.city && `, ${delivery.storeId.city}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned Rep",
      render: (delivery) => (
        <div className="text-primary font-medium">
          {delivery.assignedTo?.name || "Unassigned"}
        </div>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled At",
      render: (delivery) => (
        <div className="text-foreground">
          {(() => {
            const d = new Date(delivery.scheduledAt);
            return format(
              new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
              "MMM dd, yyyy"
            );
          })()}
        </div>
      ),
    },
    {
      key: "disposition",
      header: "Disposition",
      render: (delivery) => (
        <div className="capitalize text-foreground">
          {delivery.disposition.replace(/_/g, " ")}
        </div>
      ),
    },
    {
      key: "paymentAction",
      header: "Payment",
      render: (delivery) => (
        <div className="capitalize text-foreground">
          {delivery.paymentAction.replace(/_/g, " ")}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (delivery) => (
        <div className="text-primary font-semibold">
          ${delivery.amount.toFixed(2)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (delivery) => (
        <span
          className={cn(
            "inline-flex items-center rounded-xs px-2.5 py-1 text-xs font-medium capitalize",
            getStatusStyles(delivery.status)
          )}
        >
          {delivery.status.replace(/_/g, " ")}
        </span>
      ),
    },
  ];

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
      {/* Header */}
      <div className="flex items-center gap-2">
        <Truck className="h-6 w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Deliveries Management
        </h1>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-xs border border-border bg-card dark:bg-card max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
          {/* Date Navigation */}
          <div className="flex items-center gap-1 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevDay}
              className="h-9 w-9 shrink-0 rounded-xs bg-accent text-white hover:bg-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal rounded-xs h-9 min-w-0 dark:hover:bg-secondary border dark:border-border",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {date ? format(date, "MMM dd, yyyy") : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCurrentPage(1);
                  }}
                  initialFocus
                  className="rounded-xs"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              className="h-9 w-9 shrink-0 rounded-xs bg-accent text-white hover:bg-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Rep Select */}
          <div className="min-w-0">
            <RepSelect
              value={selectedRep}
              onChange={(val) => {
                setSelectedRep(val);
                setCurrentPage(1);
              }}
              showAllOption={true}
              className="rounded-xs h-9 border border-border w-full"
            />
          </div>

          {/* Status Select */}
          <div className="min-w-0">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="rounded-xs h-9 border border-border w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by store name..."
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-xs h-9 w-full"
            />
          </div>

          {/* Reset Button */}
          {showReset && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-xs h-9 gap-1 md:col-span-4"
            >
              <X className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      {deliveries.length === 0 ? (
        <Card className="p-6 rounded-xs text-center border-border">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              No deliveries found.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} data={deliveries} />
          <GlobalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
            limitOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
