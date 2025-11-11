"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";

interface TodayContactHeaderProps {
  repData: any;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  password: any;
  setPassword: (password: any) => void;
  handleCheckInOrOut: () => void;
  checkinLoading: boolean;
  checkoutLoading: boolean;
}

export const TodayContactHeader = ({
  repData,
  isModalOpen,
  setIsModalOpen,
  password,
  setPassword,
  handleCheckInOrOut,
  checkinLoading,
  checkoutLoading,
}: TodayContactHeaderProps) => {
  return (
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
              disabled={checkinLoading || checkoutLoading || !password.trim()}
              className="w-full"
            >
              {checkinLoading || checkoutLoading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
