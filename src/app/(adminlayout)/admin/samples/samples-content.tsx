"use client";

import type React from "react";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useGetAllSamplesQuery } from "@/redux/api/Samples/samplesApi";
import type { ISample } from "@/types";
import { RepSelect } from "@/components/Shared/RepSelect";
import {
  Package,
  Store,
  User,
  Calendar,
  FileText,
  Search,
  ClipboardList,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";

export default function SamplesListContent() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  const queryParams: Record<string, string | number> = {
    search: debouncedSearch,
    page,
    limit,
  };

  if (status !== "all") {
    queryParams.status = status;
  }

  if (selectedRep !== "all") {
    queryParams.repId = selectedRep;
  }

  const { data, isLoading } = useGetAllSamplesQuery(queryParams);
  const samples = data?.samples || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500 text-white";
      case "accepted":
        return "bg-secondary text-white";
      case "manifested":
        return "bg-purple-500 text-white";
      case "shipped":
        return "bg-emerald-500 text-white";
      case "delivered":
        return "bg-green-600 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const columns: Column<ISample>[] = [
    {
      key: "store.name",
      header: "Store Name",
      className: "min-w-[200px]",
      render: (sample) => (
        <div className="flex items-center gap-2">
          {/* Desktop: Tooltip on hover */}
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-semibold text-foreground truncate max-w-[180px] cursor-pointer">
                    {sample.store?.name || "Unknown Store"}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xs max-w-xs">
                  <p className="font-semibold">
                    {sample.store?.name || "Unknown Store"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Mobile: Show wrapped text */}
          <div className="md:hidden">
            <div className="font-semibold text-foreground wrap-break-word whitespace-normal max-w-[200px]">
              {sample.store?.name || "Unknown Store"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "rep.name",
      header: "Rep Name",
      render: (sample) => (
        <div className="text-primary font-medium">
          {sample.rep?.name || "Unknown Rep"}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "min-w-[200px]",
      render: (sample) => (
        <>
          {/* Desktop: Tooltip on hover */}
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-sm text-muted-foreground max-w-[200px] truncate cursor-pointer hover:text-foreground transition-colors">
                    {sample.description || "No description provided"}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xs max-w-xs">
                  <p className="wrap-break-word">
                    {sample.description || "No description provided"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Mobile: Show wrapped text */}
          <div className="md:hidden">
            <p className="text-sm text-muted-foreground wrap-break-word whitespace-normal max-w-[250px]">
              {sample.description || "No description provided"}
            </p>
          </div>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (sample) => (
        <span
          className={`px-2.5 py-1 rounded-xs text-xs font-medium capitalize ${getStatusStyles(
            sample.status
          )}`}
        >
          {sample.status}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (sample) => (
        <span className="text-foreground font-medium">
          {sample.createdBy?.user?.name || "N/A"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created Date",
      render: (sample) => (
        <span className="text-muted-foreground">
          {sample.createdAt
            ? format(new Date(sample.createdAt), "MMM dd, yyyy")
            : "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">All Samples</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-card rounded-xs border border-border">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by store name..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="pl-9 h-9 rounded-xs border-border focus-visible:ring-primary w-full"
          />
        </div>
        <div className="w-full">
          <RepSelect
            value={selectedRep}
            onChange={setSelectedRep}
            showAllOption={true}
            className="border border-border"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full h-9 rounded-xs border border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-xs">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="manifested">Manifested</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 border rounded-md">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Loading samples...</span>
          </div>
        </div>
      ) : samples.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border rounded-md bg-muted/10">
          <div className="bg-muted rounded-full p-4 mb-3">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No samples found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center mt-1">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} data={samples} />
          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            limitOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
