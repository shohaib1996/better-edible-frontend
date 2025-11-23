"use client";

import { useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

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
import { useGetAllDeliveriesQuery } from "@/redux/api/Deliveries/deliveryApi";
import { Delivery } from "@/types/delivery/delivery";
import { useDebounce } from "@/hooks/useDebounce";
import { RepSelect } from "@/components/Shared/RepSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeliveriesPage() {
  const [storeName, setStoreName] = useState("");
  const [status, setStatus] = useState<string>("in_transit");
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const debouncedStoreName = useDebounce(storeName, 500);

  const queryParams: any = {
    page: 1,
    limit: 50,
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

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deliveries Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="w-full md:w-1/4">
              <Input
                placeholder="Search by store name..."
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="w-full md:w-1/4">
              <RepSelect
                value={selectedRep}
                onChange={setSelectedRep}
                showAllOption={true}
              />
            </div>

            <div className="w-full md:w-1/4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="completed">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(storeName ||
              status !== "in_transit" ||
              selectedRep !== "all" ||
              date) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStoreName("");
                  setStatus("in_transit");
                  setSelectedRep("all");
                  setDate(new Date());
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
                  <TableHead>Assigned Rep</TableHead>
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
                      <TableCell>
                        <div className="font-medium">
                          {delivery.storeId?.name || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {delivery.storeId?.address}
                          {delivery.storeId?.city &&
                            `, ${delivery.storeId.city}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        {delivery.assignedTo?.name || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(delivery.scheduledAt), "PPP")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {delivery.disposition.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {delivery.paymentAction.replace(/_/g, " ")}
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
                          {delivery.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
