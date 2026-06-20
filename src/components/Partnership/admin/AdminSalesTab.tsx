"use client";

import { useState } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useGetAdminSalesQuery,
  useGetAdminInventoryQuery,
} from "@/redux/api/Partnership/partnershipApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  storeId: string;
}

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

function DatePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="group rounded-xs gap-2 font-normal min-w-[130px] justify-start border-border bg-card text-sm"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white shrink-0" />
            {selected ? format(selected, "MMM d, yyyy") : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) { onChange(format(date, "yyyy-MM-dd")); setOpen(false); }
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function AdminSalesTab({ storeId }: Props) {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useGetAdminSalesQuery({ storeId, startDate, endDate, page, limit });
  const { data: inventoryData } = useGetAdminInventoryQuery({ storeId, page: 1, limit: 1000 });

  const sales = data?.sales ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const skuToName = Object.fromEntries(
    (inventoryData?.inventory ?? []).map((item) => [item.sku, item.productName])
  );

  function handleDateChange(field: "startDate" | "endDate", value: string) {
    if (field === "startDate") setStartDate(value);
    else setEndDate(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <DatePicker label="From" value={startDate} onChange={(v) => handleDateChange("startDate", v)} />
        <DatePicker label="To" value={endDate} onChange={(v) => handleDateChange("endDate", v)} />
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground ml-auto">
            {totalCount.toLocaleString()} records
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sales.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No sales data for this period.
        </p>
      ) : (
        <>
          <div className="rounded-xs border border-border bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">SKU</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Product</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Units Sold</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Received At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {new Date(sale.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{sale.sku}</TableCell>
                    <TableCell className="px-4 py-3 font-medium">{skuToName[sale.sku] ?? ""}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold">{sale.unitsSold.toLocaleString()}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(sale.receivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            limitOptions={[10, 20, 50, 100]}
          />
        </>
      )}
    </div>
  );
}
