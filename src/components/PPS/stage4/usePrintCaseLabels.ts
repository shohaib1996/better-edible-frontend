import { useRef, useCallback } from "react";

export function usePrintCaseLabels() {
  const printRef = useRef<HTMLDivElement>(null);

  const printCaseLabels = useCallback(() => {
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

  return { printRef, printCaseLabels };
}
