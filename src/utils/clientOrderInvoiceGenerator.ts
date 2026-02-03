"use client";

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { IClientOrder } from "@/types";

let pdfMake: any = null;

// Load pdfMake only in the browser
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfMakeModule = require("pdfmake/build/pdfmake");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfFontsModule = require("pdfmake/build/vfs_fonts");

  pdfMake = pdfMakeModule;
  pdfMake.vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.vfs;
}

export const generateClientOrderInvoice = (order: IClientOrder) => {
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

  // === Calculate discount display ===
  const discountDisplay =
    order.discountType === "percentage"
      ? `${order.discount}% ($${(order.discountAmount || 0).toFixed(2)})`
      : `$${(order.discountAmount || order.discount || 0).toFixed(2)}`;

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
              { text: "CLIENT ORDER INVOICE", style: "headerRight" },
              {
                table: {
                  widths: ["auto", "auto"],
                  body: [
                    [
                      { text: "Order #:", bold: true },
                      { text: order.orderNumber },
                    ],
                    [
                      { text: "Order Date:", bold: true },
                      { text: formattedOrderDate },
                    ],
                    [
                      { text: "Delivery Date:", bold: true },
                      { text: formattedDeliveryDate },
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
              { text: order.client?.store?.name || "N/A", bold: true },
              { text: order.client?.store?.address || "" },
              {
                text: [
                  order.client?.store?.city || "",
                  order.client?.store?.state
                    ? `, ${order.client.store.state}`
                    : "",
                ].join(""),
              },
            ],
          },
          {
            width: "auto",
            stack: [
              { text: "Sales Rep:", style: "subheader" },
              { text: order.assignedRep?.name || "N/A" },
              { text: `Email: ${order.assignedRep?.email ?? "-"}` },
            ],
          },
        ],
      },

      { text: "\n\n" },

      // Order items table
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "#", style: "tableHeader", alignment: "center" },
              { text: "Product Type", style: "tableHeader" },
              { text: "Flavor", style: "tableHeader" },
              { text: "Qty", style: "tableHeader", alignment: "center" },
              { text: "Unit Price", style: "tableHeader", alignment: "right" },
              { text: "Total", style: "tableHeader", alignment: "right" },
            ],
            ...(order.items || []).map((item, index) => [
              { text: (index + 1).toString(), alignment: "center" },
              {
                stack: [
                  { text: item.productType, bold: true },
                  item.label?.labelImages && item.label.labelImages.length > 0
                    ? {
                        text: `📎 ${item.label.labelImages.length} custom label${
                          item.label.labelImages.length > 1 ? "s" : ""
                        } attached`,
                        fontSize: 8,
                        color: "#ea580c",
                        italics: true,
                        margin: [0, 2, 0, 0],
                      }
                    : {},
                ],
              },
              { text: item.flavorName, color: "#4b5563" },
              { text: item.quantity?.toString() || "0", alignment: "center" },
              {
                text: `$${(item.unitPrice || 0).toFixed(2)}`,
                alignment: "right",
              },
              {
                text: `$${(item.lineTotal || 0).toFixed(2)}`,
                alignment: "right",
                bold: true,
              },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 1 ? 2 : 0.5),
          vLineWidth: () => 0,
          hLineColor: (i: number) => (i === 1 ? "#2563eb" : "#e5e7eb"),
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },

      { text: "\n" },

      // Totals
      {
        columns: [
          { text: "", width: "*" },
          {
            width: 180,
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Subtotal:", alignment: "right" },
                  {
                    text: `$${(order.subtotal ?? 0).toFixed(2)}`,
                    alignment: "right",
                  },
                ],
                [
                  { text: "Discount:", alignment: "right", color: "#dc2626" },
                  {
                    text: `-${discountDisplay}`,
                    alignment: "right",
                    color: "#dc2626",
                  },
                ],
                [
                  {
                    text: "Grand Total:",
                    bold: true,
                    fontSize: 12,
                    alignment: "right",
                    fillColor: "#dbeafe",
                  },
                  {
                    text: `$${(order.total ?? 0).toFixed(2)}`,
                    bold: true,
                    fontSize: 12,
                    alignment: "right",
                    fillColor: "#dbeafe",
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number) => (i === 2 ? 2 : 0.5),
              vLineWidth: () => 0,
              hLineColor: (i: number) => (i === 2 ? "#2563eb" : "#e5e7eb"),
              paddingLeft: () => 8,
              paddingRight: () => 8,
            },
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
        fontSize: 20,
        bold: true,
        color: "#2563eb",
        alignment: "right",
      },
      small: { fontSize: 9, color: "#666" },
      subheader: { fontSize: 11, bold: true, margin: [0, 5, 0, 2] },
      tableHeader: {
        bold: true,
        fillColor: "#dbeafe",
        color: "#333333",
        fontSize: 10,
      },
      footer: { fontSize: 10, italics: true, color: "#555" },
    },
    defaultStyle: { fontSize: 10 },
  };

  pdfMake.createPdf(docDefinition).open();
};
