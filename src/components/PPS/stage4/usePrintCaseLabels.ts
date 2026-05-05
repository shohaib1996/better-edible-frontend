import { useRef, useCallback } from "react";
import { usePrintBridge, isPrintBridgeConfigured } from "@/hooks/usePrintBridge";
import type { ICaseLabelData } from "@/types/privateLabel/pps";

export function usePrintCaseLabels() {
  const printRef = useRef<HTMLDivElement>(null);
  const { printLabel: printViaBridge } = usePrintBridge();

  // ── Bridge print: one request per case label ──────────────────────────────

  const printCaseLabelsBridge = useCallback(
    async (cases: { caseId: string; unitCount: number; caseNumber: number; labelData: ICaseLabelData }[]) => {
      for (const c of cases) {
        await printViaBridge({
          printerKey: "case_label",
          labelType: "case_label",
          copies: 1,
          data: c.labelData,
        });
      }
    },
    [printViaBridge]
  );

  // ── Browser popup fallback ────────────────────────────────────────────────

  const printCaseLabelsBrowser = useCallback(() => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=600,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 4in; font-family: sans-serif; }
    .print-label { page-break-after: always; break-after: page; }
    .print-label:last-child { page-break-after: avoid; break-after: avoid; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  }, []);

  // ── Main: bridge first, browser fallback ─────────────────────────────────

  const printCaseLabels = useCallback(
    async (cases?: { caseId: string; unitCount: number; caseNumber: number; labelData: ICaseLabelData }[]) => {
      if (isPrintBridgeConfigured() && cases && cases.length > 0) {
        await printCaseLabelsBridge(cases);
        return;
      }
      // Fall back to browser popup (when bridge not configured or no cases array passed)
      printCaseLabelsBrowser();
    },
    [printCaseLabelsBridge, printCaseLabelsBrowser]
  );

  return { printRef, printCaseLabels };
}
