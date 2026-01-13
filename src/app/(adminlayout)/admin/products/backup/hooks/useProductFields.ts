import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";
import type { Field } from "@/components/ReUsableComponents/EntityModal";

export const useProductFields = (selectedLine: IProductLine | null): Field[] => {
  if (!selectedLine) return [];

  const fields: Field[] = [];

  // Add custom fields from ProductLine configuration
  selectedLine.fields.forEach((field) => {
    fields.push({
      name: field.name,
      label: field.label,
      placeholder: field.placeholder || "",
    });
  });

  // Add pricing fields based on pricing structure type
  if (selectedLine.pricingStructure.type === "multi-type") {
    // Add fields for each type (e.g., hybrid, indica, sativa)
    selectedLine.pricingStructure.typeLabels?.forEach((type) => {
      fields.push(
        {
          name: `${type}Units`,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Unit Price`,
        },
        {
          name: `${type}Discount`,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Discount Price`,
        }
      );
    });
  } else if (selectedLine.pricingStructure.type === "simple") {
    fields.push(
      { name: "price", label: "Unit Price", placeholder: "162.5" },
      {
        name: "discountPrice",
        label: "Discounted Price",
        placeholder: "145",
      },
      {
        name: "priceDescription",
        label: "Price Description",
        placeholder: "$3.25/unit. 50 units/case.",
      },
      {
        name: "discountDescription",
        label: "Discount Description",
        placeholder: "$2.90/unit. 50 units/case.",
      }
    );
  } else if (selectedLine.pricingStructure.type === "variants") {
    // Add fields for each variant (e.g., 100Mg, 300Mg, 1000Mg)
    selectedLine.pricingStructure.variantLabels?.forEach((variant) => {
      const variantKey = variant.replace(/\s/g, "").toLowerCase();
      fields.push(
        {
          name: `p${variantKey}`,
          label: `${variant} Price`,
          placeholder: "81.25",
        },
        {
          name: `dp${variantKey}`,
          label: `${variant} Discount Price`,
          placeholder: "70",
        }
      );
    });
  }

  return fields;
};
