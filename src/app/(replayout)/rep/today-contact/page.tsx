"use client";

import { useState, useEffect } from "react";
import { useGetAllDeliveriesQuery } from "@/src/redux/api/Deliveries/deliveryApi";
import { useUser } from "@/src/redux/hooks/useAuth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Truck,
  Loader2,
  DollarSign,
} from "lucide-react";
import {
  useGetRepByIdQuery,
  useCheckInRepMutation,
  useCheckOutRepMutation,
} from "@/src/redux/api/Rep/repApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { toast } from "sonner";
import { useDebounced } from "@/src/redux/hooks/hooks";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/src/components/ui/popover";
import { format } from "date-fns";

// ---------- INTERFACE ----------
interface Delivery {
  _id: string;
  storeId: {
    _id: string;
    name: string;
    address: string;
    city?: string | null;
    state?: string | null;
  };
  assignedTo: {
    _id: string;
    name: string;
    repType: string;
  };
  disposition: string;
  paymentAction: string;
  amount: number;
  scheduledAt: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- COMPONENT ----------
const TodayContact = () => {
  const user = useUser();
  const { data: repData } = useGetRepByIdQuery(user?.id, {
    skip: !user?.id,
  });
  const [checkin, { isLoading: checkinLoading }] = useCheckInRepMutation();
  const [checkout, { isLoading: checkoutLoading }] = useCheckOutRepMutation();
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 500 });

  // 🔹 Convert date to UTC safe string
  const utcDate = new Date(date).toISOString().split("T")[0];

  const { data, isLoading } = useGetAllDeliveriesQuery({
    assignedTo: user?.id,
    storeName: debouncedSearch,
    scheduledAt: utcDate,
  });

  const deliveries: Delivery[] = data?.deliveries || [];
  const [orderedDeliveries, setOrderedDeliveries] = useState<Delivery[]>([]);

  // 🔹 LocalStorage key per user & date
  const ORDER_STORAGE_KEY = `delivery_order_${user?.id}_${utcDate}`;
  const EXPIRATION_DAYS = 3; // ⏰ Auto-delete old records after 3 days

  // 🔹 Cleanup old localStorage entries (runs once per mount)
  useEffect(() => {
    const now = Date.now();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("delivery_order_")) {
        try {
          const stored = JSON.parse(localStorage.getItem(key)!);
          if (stored?.savedAt) {
            const savedTime = new Date(stored.savedAt).getTime();
            const ageInDays = (now - savedTime) / (1000 * 60 * 60 * 24);
            if (ageInDays > EXPIRATION_DAYS) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Ignore bad JSON data
        }
      }
    });
  }, []);

  // 🔹 Load saved order from localStorage (or default)
  useEffect(() => {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const { order } = JSON.parse(stored);
        const sorted = [...deliveries].sort(
          (a, b) => order.indexOf(a._id) - order.indexOf(b._id)
        );
        setOrderedDeliveries(sorted);
      } catch {
        setOrderedDeliveries(deliveries);
      }
    } else {
      setOrderedDeliveries(deliveries);
    }
  }, [deliveries, utcDate, user?.id]);

  // 🔹 Move Up/Down & Save order with timestamp
  const moveDelivery = (index: number, direction: "up" | "down") => {
    setOrderedDeliveries((prev) => {
      const newList = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newList.length) return prev;

      [newList[index], newList[targetIndex]] = [
        newList[targetIndex],
        newList[index],
      ];

      localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          order: newList.map((d) => d._id),
        })
      );

      return newList;
    });
  };

  // 🔹 Check-in / Check-out Logic
  const handleCheckInOrOut = async () => {
    if (!password.trim() || !user) return;

    const action = repData?.checkin ? "checkout" : "checkin";

    try {
      if (action === "checkin") {
        await checkin({ loginName: user.loginName, password }).unwrap();
        toast.success(`${user.name} checked in successfully`);
      } else {
        await checkout({ loginName: user.loginName, password }).unwrap();
        toast.success(`${user.name} checked out successfully`);
      }
      setIsModalOpen(false);
      setPassword("");
    } catch {
      const actionName = action === "checkin" ? "in" : "out";
      toast.error(`Check ${actionName} failed`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-5">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">
            Today's Contact
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-700 hover:bg-green-800 text-white">
                {repData?.checkin ? "Clock Out" : "Clock In"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {repData?.checkin ? "Clock Out" : "Clock In"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  onClick={handleCheckInOrOut}
                  disabled={
                    checkinLoading || checkoutLoading || !password.trim()
                  }
                  className="w-full"
                >
                  {checkinLoading || checkoutLoading
                    ? "Submitting..."
                    : "Submit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            {/* Previous Day Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setDate(
                  new Date(new Date(date).setDate(new Date(date).getDate() - 1))
                    .toISOString()
                    .split("T")[0]
                )
              }
            >
              <ChevronLeft />
            </Button>

            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-44 justify-center font-normal"
                >
                  {format(new Date(date), "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(date)}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      const local = new Date(
                        selectedDate.getTime() -
                          selectedDate.getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .split("T")[0];
                      setDate(local);
                    }
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>

            {/* Next Day Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setDate(
                  new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                    .toISOString()
                    .split("T")[0]
                )
              }
            >
              <ChevronRight />
            </Button>
          </div>

          <Input
            placeholder="Search store..."
            className="w-60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-6 h-6 text-green-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {orderedDeliveries.length > 0 ? (
              orderedDeliveries.map((delivery, index) => (
                <div
                  key={delivery._id}
                  className="bg-white rounded-xl border shadow-sm p-5 transition hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Store Info */}
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {delivery.storeId?.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {delivery.storeId?.address || "Address not available"}
                      </p>
                      <p className="text-xs italic text-gray-400">
                        Note: {delivery.notes || "No special notes"}
                      </p>
                      <p className="text-xs italic text-gray-400">
                        Scheduled At:{" "}
                        {delivery.scheduledAt
                          ? (() => {
                              const date = new Date(delivery.scheduledAt);
                              const day = date.getUTCDate();
                              const month = date.toLocaleString("en-US", {
                                month: "short",
                              });
                              const year = date.getUTCFullYear();
                              return `${month} ${day}, ${year}`;
                            })()
                          : "No schedule available"}
                      </p>
                    </div>

                    {/* Payment Info + Reorder */}
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <DollarSign size={16} />
                        <span>${delivery.amount.toFixed(2)}</span>
                      </div>
                      <span className="text-xs text-gray-500 uppercase">
                        {delivery.disposition.replaceAll("_", " ")}
                      </span>

                      {/* Up/Down Arrows */}
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => moveDelivery(index, "up")}
                        >
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === orderedDeliveries.length - 1}
                          onClick={() => moveDelivery(index, "down")}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-4 border-t pt-4">
                    <Button variant="outline" size="sm">
                      Order
                    </Button>
                    <Button variant="outline" size="sm">
                      Sample
                    </Button>
                    <Button variant="outline" size="sm">
                      Dismiss
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 text-sm">
                      <Truck size={16} /> Drive
                    </Button>
                    <Button className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 text-sm">
                      Follow Up
                    </Button>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between mt-4 text-xs text-gray-500">
                    <span>
                      Assigned to: {delivery.assignedTo?.name || "Unknown rep"}
                    </span>
                    <span>
                      Status:{" "}
                      <span className="capitalize font-medium text-gray-700">
                        {delivery.status.replaceAll("_", " ")}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-10">
                No deliveries assigned for today.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default TodayContact;
