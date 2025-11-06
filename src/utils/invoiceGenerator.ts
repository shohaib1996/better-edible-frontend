"use client";

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { IOrder } from "@/src/types";

let pdfMake: any = null;

// ✅ Load pdfMake only in the browser
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfMakeModule = require("pdfmake/build/pdfmake");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfFontsModule = require("pdfmake/build/vfs_fonts");

  pdfMake = pdfMakeModule;
  // ✅ Handle both export shapes
  pdfMake.vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.vfs;
}

export const generateInvoice = (order: IOrder) => {
  if (!pdfMake) {
    console.error("pdfMake not initialized. Must run on client side.");
    return;
  }

  // === Date & Time Formatting ===
  const formattedOrderDate = new Date(order.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const formattedDeliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })
    : "N/A";

  // === PDF Definition ===
  const docDefinition: TDocumentDefinitions = {
    content: [
      // Header section
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Better Edibles", style: "title" },
              { text: "1234 Market Street, Portland, OR", style: "small" },
              { text: "Phone: (555) 123-4567", style: "small" },
              { text: "Email: hello@betteredibles.com", style: "small" },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "INVOICE", style: "headerRight" },
              {
                table: {
                  widths: ["auto", "auto"],
                  body: [
                    [
                      { text: "Order Date:", bold: true },
                      { text: formattedOrderDate },
                    ],
                    [
                      { text: "Delivery Date:", bold: true },
                      { text: formattedDeliveryDate },
                    ],
                    [
                      { text: "Order #:", bold: true },
                      { text: order.orderNumber.toString() },
                    ],
                  ],
                },
                layout: "noBorders",
              },
            ],
          },
        ],
      },

      { text: "\n" },

      // Store and rep details
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Bill To:", style: "subheader" },
              { text: order.store?.name || "N/A", bold: true },
              { text: order.store?.address || "" },
              { text: order.store?.city || "" },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "Sales Rep:", style: "subheader" },
              { text: order.rep?.name || "N/A" },
              { text: `Type: ${(order.rep as any)?.repType ?? "-"}` },
            ],
          },
        ],
      },

      { text: "\n\n" },

      // Order items
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Product", style: "tableHeader" },
              { text: "Type", style: "tableHeader" },
              { text: "Qty", style: "tableHeader" },
              { text: "Unit Price", style: "tableHeader" },
              { text: "Subtotal", style: "tableHeader" },
            ],
            ...(order.items || []).map((item: any) => [
              item.name,
              item.unitLabel || "-",
              item.qty ?? 0,
              `$${(item.discountPrice || item.unitPrice || 0).toFixed(2)}`,
              `$${(item.lineTotal ?? 0).toFixed(2)}`,
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },

      // Totals
      {
        columns: [
          { text: "", width: "*" },
          {
            width: "auto",
            table: {
              body: [
                ["Subtotal:", `$${(order.subtotal ?? 0).toFixed(2)}`],
                ["Discount:", `$${(order.discount ?? 0).toFixed(2)}`],
                [
                  { text: "Grand Total:", bold: true },
                  { text: `$${(order.total ?? 0).toFixed(2)}`, bold: true },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 10, 0, 0],
          },
        ],
      },

      // Note and footer
      order.note
        ? {
            text: `Note: ${order.note}`,
            italics: true,
            margin: [0, 10, 0, 0],
          }
        : ({} as any),

      {
        text: "\nThank you for your business!",
        style: "footer",
        alignment: "center",
        margin: [0, 30, 0, 0],
      },
    ],

    styles: {
      title: { fontSize: 18, bold: true, color: "#2E3A59" },
      headerRight: {
        fontSize: 22,
        bold: true,
        color: "#333",
        alignment: "right",
      },
      small: { fontSize: 9, color: "#666" },
      subheader: { fontSize: 11, bold: true, margin: [0, 5, 0, 2] },
      tableHeader: {
        bold: true,
        fillColor: "#eeeeee",
        color: "#333333",
        fontSize: 10,
      },
      footer: { fontSize: 10, italics: true, color: "#555" },
    },
    defaultStyle: { fontSize: 10 },
  };

  pdfMake.createPdf(docDefinition).open();
};
