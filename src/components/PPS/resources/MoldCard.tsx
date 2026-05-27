"use client";

import Barcode from "react-barcode";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Mold {
  _id: string;
  moldId: string;
  barcodeValue: string;
  status: "available" | "in-use";
  unitsPerMold: number;
  currentCookItemId?: string | null;
  lastUsedAt?: string;
}

interface Props {
  mold: Mold;
  isSelected: boolean;
  onToggle: () => void;
  cookItemInfo?: { storeName: string; flavor: string };
  onRelease: () => void;
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-center font-medium truncate cursor-default">
                    {cookItemInfo.storeName} · {cookItemInfo.flavor}
                  </p>
                </TooltipTrigger>
                <TooltipContent>{cookItemInfo.storeName} · {cookItemInfo.flavor}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
