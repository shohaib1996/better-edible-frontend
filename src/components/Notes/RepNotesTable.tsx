"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";
import { INote, StoreInfo } from "@/types/note/note";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";

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

  return (
    <div className="space-y-4">
      {/* Date Picker Header */}
      <div className="flex justify-between items-center">
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
                "w-[240px] justify-start text-left font-normal",
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-muted-foreground">Loading notes...</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-muted-foreground">
            No notes found for this date
          </div>
        </div>
      ) : (
        <>
          {/* Notes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Type of Visit</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead className="min-w-[300px]">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note: INote, index: number) => {
                  const storeName =
                    typeof note.entityId === "string"
                      ? "Unknown Store"
                      : (note.entityId as StoreInfo)?.name || "Unknown Store";

                  const storeAddress =
                    typeof note.entityId === "string"
                      ? ""
                      : (note.entityId as StoreInfo)?.address || "";

                  const visitTypeDisplay = note.visitType || "N/A";
                  const dispositionDisplay = note.disposition || "N/A";

                  // Build payment info line
                  const paymentParts = [];
                  if (note.payment?.cash) paymentParts.push("Cash");
                  if (note.payment?.check) paymentParts.push("Check");
                  if (note.payment?.noPay) paymentParts.push("No Payment");
                  if (note.payment?.amount)
                    paymentParts.push(`Amount: $${note.payment.amount}`);

                  const paymentLine =
                    paymentParts.length > 0 ? paymentParts.join(", ") : "";

                  // Build visit type line
                  const visitTypeLine = `Visit Type: ${
                    note.visitType || "N/A"
                  }`;

                  // Calculate global index considering pagination
                  const globalIndex = (page - 1) * limit + index + 1;

                  return (
                    <TableRow key={note._id || index}>
                      <TableCell className="font-medium">
                        {globalIndex}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-blue-600">
                          {storeName}
                        </div>
                        {storeAddress && (
                          <div className="text-sm text-muted-foreground">
                            {note.date && (
                              (() => {
                                try {
                                  // Parse YYYY-MM-DD string properly
                                  const [year, month, day] = note.date.split('-');
                                  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                  return format(dateObj, "MM/dd/yyyy");
                                } catch {
                                  return note.date;
                                }
                              })()
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{visitTypeDisplay}</div>
                        {(note.sample || note.delivery) && (
                          <div className="text-sm text-muted-foreground">
                            {note.sample && "with sample"}
                            {note.sample && note.delivery && ", "}
                            {note.delivery && "with delivery"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{dispositionDisplay}</div>
                        {/* {visitTypeLine && (
                          <div className="text-sm font-medium">
                            {visitTypeLine}
                          </div>
                        )} */}
                        {paymentLine && (
                          <div className="text-sm font-medium">
                            {paymentLine}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-pre-wrap">
                          {note.content || "No message"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

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
