"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";
import { INote, StoreInfo } from "@/types/note/note";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";

interface RepNotesTableProps {
  repId: string;
}

export function RepNotesTable({ repId }: RepNotesTableProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Format date for API (YYYY-MM-DD)
  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Fetch notes for the selected rep and date
  const { data: notesData, isLoading } = useGetAllNotesQuery({
    repId,
    date: dateString,
    page,
    limit,
  });

  const notes = notesData?.notes || [];
  const total = notesData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  const columns: Column<INote>[] = [
    {
      key: "index",
      header: "#",
      className: "w-[50px] font-medium",
      render: (_, index) => {
        const globalIndex = (page - 1) * limit + index + 1;
        return <span>{globalIndex}</span>;
      },
    },
    {
      key: "storeName",
      header: "Store Name",
      render: (note) => {
        const storeName =
          typeof note.entityId === "string"
            ? "Unknown Store"
            : (note.entityId as StoreInfo)?.name || "Unknown Store";

        const storeAddress =
          typeof note.entityId === "string"
            ? ""
            : (note.entityId as StoreInfo)?.address || "";

        return (
          <div>
            <div className="font-medium text-primary">{storeName}</div>
            {storeAddress && (
              <div className="text-sm text-muted-foreground">
                {note.date &&
                  (() => {
                    try {
                      // Parse "YYYY-MM-DD HH:MM" format
                      const [datePart, timePart] = note.date.split(' ');
                      const [year, month, day] = datePart.split('-');
                      const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];

                      const dateObj = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        parseInt(hours),
                        parseInt(minutes)
                      );

                      // Format as "MM/DD/YYYY HH:MM AM/PM"
                      const dateStr = format(dateObj, "MM/dd/yyyy");
                      const hour12 = parseInt(hours) % 12 || 12;
                      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                      const timeStr = `${hour12}:${minutes} ${ampm}`;

                      return `${dateStr} ${timeStr}`;
                    } catch {
                      return note.date;
                    }
                  })()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "visitType",
      header: "Type of Visit",
      render: (note) => (
        <div>
          <div>{note.visitType || "N/A"}</div>
          {(note.sample || note.delivery) && (
            <div className="text-sm text-muted-foreground">
              {note.sample && "with sample"}
              {note.sample && note.delivery && ", "}
              {note.delivery && "with delivery"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "disposition",
      header: "Disposition",
      render: (note) => {
        const paymentParts = [];
        if (note.payment?.cash) paymentParts.push("Cash");
        if (note.payment?.check) paymentParts.push("Check");
        if (note.payment?.noPay) paymentParts.push("No Payment");
        if (note.payment?.amount)
          paymentParts.push(`Amount: $${note.payment.amount}`);
        const paymentLine =
          paymentParts.length > 0 ? paymentParts.join(", ") : "";

        return (
          <div>
            <div>{note.disposition || "N/A"}</div>
            {paymentLine && (
              <div className="text-sm font-medium">{paymentLine}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "content",
      header: "Message",
      className: "min-w-[300px]",
      render: (note) => (
        <div className="whitespace-pre-wrap">
          {note.content || "No message"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Date Picker Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Viewing notes for {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[240px] justify-start text-left font-normal rounded-xs bg-accent text-white dark:bg-accent hover:bg-accent/90 dark:hover:bg-accent/90",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setPage(1); // Reset to first page when changing date
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Total Notes Info */}
      <div className="text-sm text-muted-foreground">
        Total Notes:{" "}
        <span className="font-semibold text-foreground">{total}</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 border rounded-md">
          {/* You might want a better loader here, but text is fine for now or reusable Loader */}
          <div className="text-muted-foreground">Loading notes...</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border rounded-md bg-muted/10">
          <div className="bg-muted rounded-full p-4 mb-3">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No notes found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center mt-1">
            We couldn't find any notes for{" "}
            {format(selectedDate, "MMMM d, yyyy")}. Try selecting a different
            date.
          </p>
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={notes} />

          {/* Pagination */}
          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            limitOptions={[10, 20, 50, 100]}
          />
        </>
      )}
    </div>
  );
}
