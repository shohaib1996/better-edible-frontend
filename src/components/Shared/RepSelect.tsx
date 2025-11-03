"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { useGetAllRepsQuery } from "@/src/redux/api/Rep/repApi";
import { Loader2 } from "lucide-react";

interface RepSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export const RepSelect: React.FC<RepSelectProps> = ({ value, onChange }) => {
  const { data, isLoading } = useGetAllRepsQuery({});
  const reps = data?.data || [];

  return (
    <div className="space-y-1">
      {/* <label className="text-sm font-medium text-gray-700">Select Rep</label> */}
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a rep" />
          </SelectTrigger>
          <SelectContent>
            {reps.map((rep: any) => (
              <SelectItem key={rep._id} value={rep._id}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
