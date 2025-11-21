"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/redux/hooks/useAuth";
import { useGetAllDeliveriesQuery } from "@/redux/api/Deliveries/deliveryApi";
import { Delivery } from "@/types/delivery/delivery";
import { useDebounced } from "@/redux/hooks/hooks";

export default function DeliveryPage() {
  const user = useUser();
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState<string>("");
  const [date, setDate] = useState<DateRange | undefined>();

  const debouncedStoreName = useDebounced({
    searchQuery: storeName,
    delay: 500,
  });

  const queryParams: any = {
    assignedTo: user?.id,
    page: 1,
    limit: 50, // Fetch more for the table
  };

  if (debouncedStoreName) queryParams.storeName = debouncedStoreName;
  if (status && status !== "all") queryParams.status = status;
  if (date?.from) queryParams.startDate = date.from.toISOString();
  if (date?.to) queryParams.endDate = date.to.toISOString();

  const { data, isLoading, isError } = useGetAllDeliveriesQuery(queryParams, {
    skip: !user?.id,
  });

  const deliveries: Delivery[] = data?.deliveries || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Deliveries</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search by store name..."
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full border-green-500"
          />
        </div>

        <div className="w-full md:w-1/9">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="border-green-500">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {/* <SelectItem value="pending">Pending</SelectItem> */}
              {/* <SelectItem value="assigned">Assigned</SelectItem> */}
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              {/* <SelectItem value="cancelled">Cancelled</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild className="border-green-500">
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {(storeName || status || date) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStoreName("");
              setStatus("");
              setDate(undefined);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Scheduled At</TableHead>
              <TableHead>Disposition</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading deliveries...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-red-500"
                >
                  Error loading deliveries.
                </TableCell>
              </TableRow>
            ) : deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery) => (
                <TableRow key={delivery._id}>
                  <TableCell className="font-medium">
                    {delivery.storeId?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {delivery.storeId?.address}
                    {delivery.storeId?.city && `, ${delivery.storeId.city}`}
                  </TableCell>
                  <TableCell>
                    {format(new Date(delivery.scheduledAt), "PPP")}
                  </TableCell>
                  <TableCell className="capitalize">
                    {delivery.disposition.replace("_", " ")}
                  </TableCell>
                  <TableCell className="capitalize">
                    {delivery.paymentAction.replace("_", " ")}
                  </TableCell>
                  <TableCell>${delivery.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        {
                          "bg-yellow-100 text-yellow-800":
                            delivery.status === "pending",
                          "bg-blue-100 text-blue-800":
                            delivery.status === "assigned",
                          "bg-purple-100 text-purple-800":
                            delivery.status === "in_transit",
                          "bg-green-100 text-green-800":
                            delivery.status === "completed",
                          "bg-red-100 text-red-800":
                            delivery.status === "cancelled",
                        }
                      )}
                    >
                      {delivery.status.replace("_", " ")}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
