"use client";

// Shared design request submission form used by:
// - Store portal: /store/design-requests/new (source="store", allowTypeToggle=true)
// - Admin modal: /admin/design-requests (source="admin", forcedType="inhouse")
// - Rep page: /rep/design-requests (source="rep", forcedType="inhouse")

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileUploadZone } from "./FileUploadZone";
import { DesignRequestType, DesignRequestSource, IDesignTemplate } from "@/types/designRequests/designRequests";
import {
  useSubmitDesignRequestMutation,
  useUploadRequestFilesMutation,
  useGetDesignTemplatesQuery,
} from "@/redux/api/DesignRequests/designRequestsApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LayoutTemplate, ChevronDown, ChevronUp } from "lucide-react";

const PRODUCT_LINES = ["CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy"];
const FORMAT_OPTIONS = [
  "Social Media Post", "Banner", "Flyer", "Label", "Menu", "Poster",
  "Business Card", "Logo", "Email Template", "Shelf Talker", "Other",
];

const schema = z.object({
  requestType: z.enum(["free", "paid", "inhouse"] as const),
  productLine: z.string().optional(),
  format: z.string().min(1, "Please select a format"),
  description: z.string().min(10, "Please describe what you need (at least 10 characters)"),
});

type FormValues = z.infer<typeof schema>;

interface DesignRequestFormProps {
  source: DesignRequestSource;
  submittedBy: string;
  submittedByName: string;
  storeId?: string;
  storeName?: string;
  contactId?: string;
  allowTypeToggle?: boolean;
  forcedType?: DesignRequestType;
  onSuccess?: () => void;
}

export function DesignRequestForm({
  source,
  submittedBy,
  submittedByName,
  storeId,
  storeName,
  contactId,
  allowTypeToggle = true,
  forcedType,
  onSuccess,
}: DesignRequestFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IDesignTemplate | null>(null);

  const [submitRequest, { isLoading: isSubmitting }] = useSubmitDesignRequestMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadRequestFilesMutation();
  const isLoading = isSubmitting || isUploading;

  const { data: templatesData } = useGetDesignTemplatesQuery({ active: true });
  const templates = templatesData?.templates ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requestType: forcedType ?? "free",
      productLine: undefined,
      format: "",
      description: "",
    },
  });

  const requestType = form.watch("requestType");
  const showProductLine = requestType === "free";

  function applyTemplate(t: IDesignTemplate) {
    setSelectedTemplate(t);
    form.setValue("format", t.format);
    if (t.productLine) form.setValue("productLine", t.productLine);
    if (t.defaultDescription) form.setValue("description", t.defaultDescription);
    setShowTemplates(false);
    toast.success(`Template "${t.name}" applied`);
  }

  async function onSubmit(values: FormValues) {
    try {
      const result = await submitRequest({
        requestType: values.requestType,
        source,
        storeId,
        storeName,
        contactId,
        submittedBy,
        submittedByName,
        productLine: values.productLine,
        format: values.format,
        description: values.description,
        templateId: selectedTemplate?._id,
        templateName: selectedTemplate?.name,
      }).unwrap();

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        await uploadFiles({ id: result.request._id, files: fd }).unwrap();
      }

      toast.success("Request submitted");
      form.reset();
      setFiles([]);
      setSelectedTemplate(null);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit request");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* Template picker */}
        {templates.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
              {selectedTemplate ? `Template: ${selectedTemplate.name}` : "Start from a template (optional)"}
              {showTemplates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTemplates && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={cn(
                      "group relative rounded-xs border-2 overflow-hidden text-left transition-all hover:border-primary",
                      selectedTemplate?._id === t._id ? "border-primary" : "border-border"
                    )}
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      {t.previewUrl ? (
                        <img src={t.previewUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <LayoutTemplate className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-semibold line-clamp-1">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.format} · {t.dimensions}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Free/Paid toggle */}
        {allowTypeToggle && !forcedType && (
          <FormField
            control={form.control}
            name="requestType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Request Type</FormLabel>
                <div className="flex gap-2">
                  {(["free", "paid"] as DesignRequestType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => field.onChange(t)}
                      className={`flex-1 py-2 rounded-xs text-sm border font-medium transition-colors capitalize ${
                        field.value === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {t === "free" ? "Free — Our Products" : "Paid — Custom Design"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {field.value === "free"
                    ? "Assets for Better Edibles products are provided at no charge."
                    : "Custom designs for your store brand are billed separately."}
                </p>
              </FormItem>
            )}
          />
        )}

        {/* Product line */}
        {showProductLine && (
          <FormField
            control={form.control}
            name="productLine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Line</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="rounded-xs border border-border bg-background">
                      <SelectValue placeholder="Which product line is this for?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_LINES.map((pl) => (
                      <SelectItem key={pl} value={pl}>{pl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Format */}
        <FormField
          control={form.control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Format</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xs border border-border bg-background">
                    <SelectValue placeholder="What type of asset do you need?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FORMAT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what you need — include dimensions, colors, text, any references, and the intended use."
                  className="rounded-xs min-h-[120px] border border-border bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reference files */}
        <FileUploadZone
          files={files}
          onChange={setFiles}
          label="Reference Files (optional)"
        />

        <Button type="submit" className="w-full rounded-xs" disabled={isLoading} size="lg">
          {isLoading ? "Submitting…" : "Submit Request"}
        </Button>
      </form>
    </Form>
  );
}
