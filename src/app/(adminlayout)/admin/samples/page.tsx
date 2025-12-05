"use client";

import { useState } from "react";
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
import { useGetAllSamplesQuery } from "@/redux/api/Samples/samplesApi ";
import { ISample } from "@/types";
import { RepSelect } from "@/components/Shared/RepSelect";

const SamplesList = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 500);

  const queryParams: any = {
    search: debouncedSearch,
  };

  if (status !== "all") {
    queryParams.status = status;
  }

  if (selectedRep !== "all") {
    queryParams.repId = selectedRep;
  }

  const { data, isLoading } = useGetAllSamplesQuery(queryParams);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Samples List</CardTitle>
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
            <div className="w-[200px]">
              <RepSelect
                value={selectedRep}
                onChange={setSelectedRep}
                showAllOption={true}
              />
            </div>
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
                  <TableHead>Rep Name</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data?.samples?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No samples found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.samples?.map((sample: ISample) => (
                    <TableRow key={sample._id}>
                      <TableCell className="font-medium">
                        {sample.store?.name || "Unknown Store"}
                      </TableCell>
                      <TableCell>{sample.rep?.name || "Unknown Rep"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {Object.entries(sample.samples || {}).map(
                            ([key, value]) => (
                              <span key={key} className="text-sm">
                                <span className="font-semibold capitalize">
                                  {key}:
                                </span>{" "}
                                {value as string}
                              </span>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            sample.status === "delivered"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          {sample.status}
                        </span>
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

export default SamplesList;
