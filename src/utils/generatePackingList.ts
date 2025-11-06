"use client";

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { IOrder } from "@/src/types";

let pdfMake: any = null;

if (typeof window !== "undefined") {
  const pdfMakeModule = require("pdfmake/build/pdfmake");
  const pdfFontsModule = require("pdfmake/build/vfs_fonts");
  pdfMake = pdfMakeModule;
  pdfMake.vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.vfs;
}

export const generatePackingList = (
  order: IOrder,
  qaChecks: { [key: string]: boolean }
) => {
  if (!pdfMake) return;

  const orderDate = new Date(order.createdAt).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  const deliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-US")
    : "N/A";

  const totalCases =
    order.items?.reduce((sum: number, item: any) => sum + (item.qty ?? 0), 0) ||
    0;

  // ✅ Table body with vector-based checkmarks
  const tableBody = [
    [
      { text: "#", bold: true },
      { text: "Product Name", bold: true },
      { text: "Cases", bold: true },
      { text: "Metric Tag", bold: true },
      { text: "QA", bold: true, alignment: "center" },
    ],
    ...(order.items || []).map((item: any, idx: number) => {
      const key = `${item.product}-${item.unitLabel || "none"}`;
      const isChecked = qaChecks[key];

      // ✅ If checked, render vector tick; else empty
      const qaCell = isChecked
        ? {
            canvas: [
              {
                type: "polyline",
                lineWidth: 2.5,
                color: "#16a34a", // nicer modern green
                closePath: false,
                points: [
                  { x: 1, y: 7 },
                  { x: 4, y: 11 },
                  { x: 10, y: 2 },
                ],
                lineCap: "round",
                lineJoin: "round",
              },
            ],
            alignment: "center",
            margin: [0, 0, 0, 0],
          }
        : { text: "", alignment: "center" };

      return [
        idx + 1,
        `${item.name}${item.unitLabel ? ` - ${item.unitLabel}` : ""}`,
        item.qty ?? 0,
        "",
        qaCell,
      ];
    }),
    [
      { text: "Total Cases", colSpan: 2, bold: true, alignment: "right" },
      {},
      { text: totalCases.toString(), bold: true, alignment: "center" },
      {},
      {},
    ],
  ];

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: "PACKING LIST", style: "header", alignment: "center" },
      {
        text: order.store?.name || "N/A",
        style: "subheader",
        color: "#0057b7",
        margin: [0, 10, 0, 2],
      },
      { text: order.store?.address || "", margin: [0, 0, 0, 8] },
      { text: `Order#: ${order.orderNumber}` },
      { text: `Order Date: ${orderDate}` },
      { text: `Delivery Date: ${deliveryDate}` },
      { text: "\n" },

      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto"],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return "#f3f4f6"; // Header
            if (
              rowIndex > 0 &&
              qaChecks[
                `${order.items?.[rowIndex - 1]?.product}-${
                  order.items?.[rowIndex - 1]?.unitLabel || "none"
                }`
              ]
            ) {
              return "#e8f5e9"; // Light green for checked rows
            }
            return null;
          },
        },
      },

      ...(order.note
        ? [
            {
              text: `\nNote: ${order.note}`,
              italics: true,
              fontSize: 9,
            },
          ]
        : []),
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 12, bold: true },
    },
  };

  pdfMake.createPdf(docDefinition).open();
};
