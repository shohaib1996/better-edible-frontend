"use client";

import type React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = "No data found.",
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "rounded-xs border shadow-sm bg-card border-border overflow-x-auto",
        className
      )}
    >
      <Table>
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary border-b-0">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn("text-secondary-foreground", col.className)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-6">
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-6 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={row._id || index}
                className={index % 2 === 0 ? "bg-muted/20" : ""}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.key)} className={col.className}>
                    {col.render
                      ? col.render(row, index)
                      : (row[col.key as keyof T] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
