"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { CalendarClock, Clock, LogIn, LogOut } from "lucide-react";

interface TodayContactHeaderProps {
  repData: any;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  pin: string;
  setPin: (pin: string) => void;
  handleCheckInOrOut: () => void;
  checkinLoading: boolean;
  checkoutLoading: boolean;
}

export const TodayContactHeader = ({
  repData,
  isModalOpen,
  setIsModalOpen,
  pin,
  setPin,
  handleCheckInOrOut,
  checkinLoading,
  checkoutLoading,
}: TodayContactHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
        <CalendarClock className="h-6 w-6 text-primary" />
        Today&apos;s Contact
      </h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/rep/time-logs">
          <Button className="bg-accent hover:bg-primary text-white rounded-xs flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Time logs</span>
          </Button>
        </Link>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-primary text-white rounded-xs flex items-center gap-2">
              {repData?.checkin ? (
                <>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Clock Out</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Clock In</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xs">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {repData?.checkin ? "Clock Out" : "Clock In"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="rounded-xs"
              />
              <Button
                onClick={handleCheckInOrOut}
                disabled={checkinLoading || checkoutLoading || !pin.trim()}
                className="w-full bg-accent hover:bg-primary text-white rounded-xs"
              >
                {checkinLoading || checkoutLoading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
