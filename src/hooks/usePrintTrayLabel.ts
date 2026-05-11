"use client";

import { useCallback } from "react";
import { usePrintBridge, isPrintBridgeConfigured } from "@/hooks/usePrintBridge";
import type { ICookItem } from "@/types/privateLabel/pps";

export interface TrayPrintData {
  cookItem: ICookItem;
  trayId: string;
  moldId: string;
  dehydratorUnitId: string;
  shelfPosition: number;
  loadTimestamp?: string;
}

export function usePrintTrayLabel() {
  const { printLabel: printViaBridge } = usePrintBridge();

  const printTrayLabel = useCallback(
    async (data: TrayPrintData): Promise<void> => {
      if (!isPrintBridgeConfigured()) return;

      await printViaBridge({
        printerKey: "tray_label",
        labelType: "tray_label",
        copies: 1,
        data: {
          storeName: data.cookItem.storeName,
          flavor: data.cookItem.flavor,
          quantity: data.cookItem.quantity,
          productType: data.cookItem.productType,
          cookItemId: data.cookItem.cookItemId,
          orderId: data.cookItem.orderId,
          trayId: data.trayId,
          moldId: data.moldId,
          dehydratorUnitId: data.dehydratorUnitId,
          shelfPosition: data.shelfPosition,
          loadTimestamp: data.loadTimestamp ?? new Date().toISOString(),
        },
      });
    },
    [printViaBridge]
  );

  return { printTrayLabel };
}
