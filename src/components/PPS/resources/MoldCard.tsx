"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import Barcode from "react-barcode";
import { Store, Candy, Hash, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface Mold {
  _id: string;
  moldId: string;
  barcodeValue: string;
  status: "available" | "in-use";
  unitsPerMold: number;
  currentCookItemId?: string | null;
  lastUsedAt?: string;
}

interface CookItemInfo {
  storeName: string;
  flavor: string;
  orderId: string;
  createdAt: string;
}

interface Props {
  mold: Mold;
  isSelected: boolean;
  onToggle: () => void;
  cookItemInfo?: CookItemInfo;
  onRelease: () => void;
}

function CookItemPopover({ info, cookItemId }: { info: CookItemInfo; cookItemId: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative flex justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <p className="text-xs text-center font-medium truncate cursor-default underline decoration-dotted underline-offset-2 decoration-muted-foreground max-w-full">
        {cookItemId}
      </p>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-xs border border-border bg-popover shadow-lg p-3 space-y-2"
          >
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-popover -mt-px" />

            <div className="flex items-center gap-2 text-xs">
              <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Store</p>
                <p className="font-semibold text-foreground truncate capitalize">{info.storeName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Candy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Flavor</p>
                <p className="font-semibold text-foreground truncate capitalize">{info.flavor}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Order ID</p>
                <p className="font-mono font-medium text-foreground truncate">{info.orderId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
                <p className="font-medium text-foreground">
                  {format(new Date(info.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MoldCard({ mold, isSelected, onToggle, cookItemInfo, onRelease }: Props) {
  return (
    <Card className="rounded-xs">
      <CardContent className="px-3 py-0">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggle}
              disabled={mold.status === "in-use"}
              className={mold.status === "in-use" ? "opacity-40" : ""}
            />
            <span className="font-medium text-sm">{mold.moldId}</span>
          </div>
          <Badge
            variant="outline"
            className={
              mold.status === "available"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-red-500/10 text-red-600 border-red-500/20"
            }
          >
            {mold.status}
          </Badge>
        </div>

        <div className="flex justify-center my-2">
          <Barcode value={mold.barcodeValue} width={1.5} height={40} fontSize={10} margin={0} displayValue />
        </div>

        <p className="text-xs text-muted-foreground text-center">{mold.unitsPerMold} units/mold</p>

        {mold.status === "in-use" && mold.currentCookItemId && (
          cookItemInfo ? (
            <CookItemPopover info={cookItemInfo} cookItemId={mold.currentCookItemId} />
          ) : (
            <p className="text-xs text-muted-foreground text-center truncate">{mold.currentCookItemId}</p>
          )
        )}

        {mold.lastUsedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Last used: {new Date(mold.lastUsedAt).toLocaleDateString()}
          </p>
        )}

        {mold.status === "in-use" && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Force release</span>
            <Switch checked={false} onCheckedChange={onRelease} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
