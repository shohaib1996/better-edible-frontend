"use client";

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { IPrivateLabelOrder } from "@/types";

let pdfMake: any = null;

if (typeof window !== "undefined") {
  const pdfMakeModule = require("pdfmake/build/pdfmake");
  const pdfFontsModule = require("pdfmake/build/vfs_fonts");
  pdfMake = pdfMakeModule;
  pdfMake.vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.vfs;
}

export const generatePrivateLabelPackingList = (
  order: IPrivateLabelOrder,
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

  const totalQuantity =
    order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) || 0;

  // ✅ Table body with vector-based checkmarks
  const tableBody: any[] = [
    [
      { text: "#", bold: true },
      { text: "Product Type", bold: true },
      { text: "Flavor", bold: true },
      { text: "Qty", bold: true },
      { text: "QA", bold: true, alignment: "center" as const },
    ],
    ...(order.items || []).map((item, idx: number) => {
      const key = `${item.privateLabelType}-${item.flavor}`;
      const isChecked = qaChecks[key];

      // ✅ If checked, render vector tick; else empty
      const qaCell = isChecked
        ? {
            canvas: [
              {
                type: "polyline" as const,
                lineWidth: 2.5,
                color: "#16a34a", // green
                closePath: false,
                points: [
                  { x: 1, y: 7 },
                  { x: 4, y: 11 },
                  { x: 10, y: 2 },
                ],
                lineCap: "round" as const,
                lineJoin: "round" as const,
              },
            ],
            alignment: "center" as const,
            margin: [0, 0, 0, 0] as [number, number, number, number],
          }
        : { text: "", alignment: "center" as const };

      return [
        idx + 1,
        item.privateLabelType,
        item.flavor,
        item.quantity ?? 0,
        qaCell,
      ];
    }),
    [
      {
        text: "Total Quantity",
        colSpan: 3,
        bold: true,
        alignment: "right" as const,
      },
      {},
      {},
      {
        text: totalQuantity.toString(),
        bold: true,
        alignment: "center" as const,
      },
      {},
    ],
  ];

  const docDefinition: TDocumentDefinitions = {
    content: [
      {
        text: "PRIVATE LABEL PACKING LIST",
        style: "header",
        alignment: "center",
        color: "#ea580c",
      },
      {
        text: order.store?.name || "N/A",
        style: "subheader",
        color: "#0057b7",
        margin: [0, 10, 0, 2],
      },
      { text: order.store?.address || "", margin: [0, 0, 0, 8] },
      { text: `Order ID: ${order._id.slice(-8).toUpperCase()}` },
      { text: `Order Date: ${orderDate}` },
      { text: `Delivery Date: ${deliveryDate}` },
      { text: "\n" },
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*", "auto", "auto"],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return "#fed7aa"; // Orange header
            if (
              rowIndex > 0 &&
              order.items?.[rowIndex - 1] &&
              qaChecks[
                `${order.items[rowIndex - 1].privateLabelType}-${
                  order.items[rowIndex - 1].flavor
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
