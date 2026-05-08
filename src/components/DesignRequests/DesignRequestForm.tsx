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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadZone } from "./FileUploadZone";
import { DesignRequestType, DesignRequestSource } from "@/types/designRequests/designRequests";
import { useSubmitDesignRequestMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { useUploadRequestFilesMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { toast } from "sonner";

const PRODUCT_LINES = ["CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy"];

// productLine is only required when requestType = "free" (free requests are company products only)
const schema = z.object({
  requestType: z.enum(["free", "paid", "inhouse"] as const),
  productLine: z.string().optional(),
  description: z.string().min(10, "Please describe what you need (at least 10 characters)"),
});

type FormValues = z.infer<typeof schema>;

interface DesignRequestFormProps {
  // Who is submitting and from where — determines queueType on the backend
  source: DesignRequestSource;
  submittedBy: string;       // userId
  submittedByName: string;   // display name
  storeId?: string;          // required when source="store"
  storeName?: string;        // denormalized for quick display in request list
  contactId?: string;        // required when source="store" (links request to contact)
  // When true, shows Free/Paid toggle (store users). When false or forcedType is set, toggle is hidden.
  allowTypeToggle?: boolean;
  forcedType?: DesignRequestType; // admin/rep always submit "inhouse" — no toggle shown
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
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitDesignRequestMutation();
  const [uploadFiles, { isLoading: isUploading }] = useUploadRequestFilesMutation();
  // Single loading flag covers both the request creation and the file upload steps
  const isLoading = isSubmitting || isUploading;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requestType: forcedType ?? "free",
      productLine: undefined,
      description: "",
    },
  });

  const requestType = form.watch("requestType");
  // Product line dropdown only appears for free requests (company products only)
  const showProductLine = requestType === "free";

  async function onSubmit(values: FormValues) {
    try {
      // Step 1: create the request record
      const result = await submitRequest({
        requestType: values.requestType,
        source,
        storeId,
        storeName,
        contactId,
        submittedBy,
        submittedByName,
        productLine: values.productLine,
        description: values.description,
      }).unwrap();

      // Step 2: upload reference files if any were attached (uses the new request's _id)
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        await uploadFiles({ id: result.request._id, files: fd }).unwrap();
      }

      toast.success("Request submitted");
      form.reset();
      setFiles([]);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit request");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Free/Paid toggle — only shown to store users, hidden when forcedType is set */}
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
                      {t}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />
        )}

        {/* Product line — required for free requests (company products only) */}
        {showProductLine && (
          <FormField
            control={form.control}
            name="productLine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Line</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xs">
                      <SelectValue placeholder="Select product line" />
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what you need — include dimensions, colors, text, references, etc."
                  className="rounded-xs min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional reference files — uploaded to Cloudinary after request is created */}
        <FileUploadZone
          files={files}
          onChange={setFiles}
          label="Reference Files (optional)"
        />

        <Button type="submit" className="w-full rounded-xs" disabled={isLoading} size="lg">
          {isLoading ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </Form>
  );
}
