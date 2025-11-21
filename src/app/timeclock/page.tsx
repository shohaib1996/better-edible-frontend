"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCheckInRepMutation,
  useCheckOutRepMutation,
  useGetAllRepsQuery,
} from "@/redux/api/Rep/repApi";
import { IRep } from "@/types";

const TimeClock = () => {
  const { data, isLoading, refetch } = useGetAllRepsQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );
  const [checkin, { isLoading: checkinLoading }] = useCheckInRepMutation();
  const [checkout, { isLoading: checkoutLoading }] = useCheckOutRepMutation();
  const reps: IRep[] = data?.data || [];

  const [mode, setMode] = useState<{
    repId: string;
    action: "checkin" | "checkout";
  } | null>(null);
  const [password, setPassword] = useState("");

  const isSubmitting = checkinLoading || checkoutLoading;

  const handleSubmit = async (rep: IRep) => {
    if (!mode) return;
    const { action } = mode;
    if (isSubmitting || !password.trim()) return;

    try {
      if (action === "checkin") {
        await checkin({ loginName: rep.loginName, password }).unwrap();
        toast.success(`${rep.name} checked in successfully`);
      } else {
        await checkout({ loginName: rep.loginName, password }).unwrap();
        toast.success(`${rep.name} checked out successfully`);
      }
      refetch();
    } catch (error) {
      const actionName = action === "checkin" ? "in" : "out";
      toast.error(`Check ${actionName} failed`);
    } finally {
      setMode(null);
      setPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Time Clock</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reps.map((rep) => {
          const isActiveMode = mode?.repId === rep._id;
          const isThisSubmitting = isActiveMode && isSubmitting;
          const showStatus = !!mode ? false : true; // Hide status when input is open
          return (
            <Card
              key={rep._id}
              className={`hover:shadow-lg transition-all duration-300 ${
                rep.checkin
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-center mb-2">
                  {rep.name}
                </CardTitle>
                {showStatus && (
                  <div className="flex justify-center">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        rep.checkin
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rep.checkin ? "Checked In" : "Checked Out"}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {isActiveMode ? (
                  <div className="space-y-3">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={isThisSubmitting}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmit(rep)}
                        disabled={isThisSubmitting || !password.trim()}
                        className="flex-1"
                      >
                        {isThisSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMode(null);
                          setPassword("");
                        }}
                        disabled={isThisSubmitting}
                        className="shrink-0"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : rep.checkin ? (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      setMode({ repId: rep._id, action: "checkout" })
                    }
                    disabled={isSubmitting}
                    className="w-full cursor-pointer"
                  >
                    Check Out
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      setMode({ repId: rep._id, action: "checkin" })
                    }
                    disabled={isSubmitting}
                    className="w-full cursor-pointer"
                  >
                    Check In
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TimeClock;
