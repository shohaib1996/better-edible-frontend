"use client";

import { useState } from "react";
import { useUser } from "@/redux/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  useGetAllSamplesQuery,
  useUpdateSampleStatusMutation,
} from "@/redux/api/Samples/samplesApi";
import { ISample } from "@/types";
import { toast } from "sonner";

const SampleList = () => {
  const user = useUser();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 500);
  const [updateSampleStatus] = useUpdateSampleStatusMutation();

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateSampleStatus({ id, status: newStatus }).unwrap();
      if (newStatus === "delivered") {
        toast.success("Sample delivered Successfully");
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const queryParams: any = {
    repId: user?.id,
    search: debouncedSearch,
  };

  if (status !== "all") {
    queryParams.status = status;
  }

  const { data, isLoading } = useGetAllSamplesQuery(queryParams, {
    skip: !user?.id,
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sample List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by store name..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="max-w-sm"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data?.samples?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No samples found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.samples?.map((sample: ISample) => (
                    <TableRow key={sample._id}>
                      <TableCell className="font-medium">
                        {sample.store?.name || "Unknown Store"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-md">
                          {sample.description || "No description provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sample.status}
                          onValueChange={(val) =>
                            handleStatusChange(sample._id, val)
                          }
                        >
                          <SelectTrigger
                            className={`w-[140px] h-8 capitalize ${
                              sample.status === "delivered" ||
                              sample.status === "shipped"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : sample.status === "cancelled"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : sample.status === "manifested"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : sample.status === "accepted"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="manifested">
                              Manifested
                            </SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {sample.createdAt
                          ? format(new Date(sample.createdAt), "PPP")
                          : "N/A"}
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
};

export default SampleList;
