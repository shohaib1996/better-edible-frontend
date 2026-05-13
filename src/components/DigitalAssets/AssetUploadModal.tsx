"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { IDigitalAsset, AssetCategory, ProductLine } from "@/types/digitalAssets/digitalAssets";
import {
  useCreateDigitalAssetMutation,
  useUpdateDigitalAssetMutation,
} from "@/redux/api/DigitalAssets/digitalAssetsApi";

const CATEGORIES: AssetCategory[] = ["Banner", "ProductImage", "Video", "Email", "Flyer", "Social", "Text", "Other"];
const PRODUCT_LINES: ProductLine[] = ["CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy"];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["Banner", "ProductImage", "Video", "Email", "Flyer", "Social", "Text", "Other"] as const),
  productLine: z.enum(["CannaCrispy", "FiftyOneFifty", "Bliss", "YummyGummy"] as const).optional(),
  assetType: z.enum(["file", "text"] as const),
  textContent: z.string().optional(),
  status: z.enum(["active", "archived"] as const).optional(),
});

type FormValues = z.infer<typeof schema>;

interface AssetUploadModalProps {
  open: boolean;
  onClose: () => void;
  editing?: IDigitalAsset | null;
}

export function AssetUploadModal({ open, onClose, editing }: AssetUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createAsset, { isLoading: isCreating }] = useCreateDigitalAssetMutation();
  const [updateAsset, { isLoading: isUpdating }] = useUpdateDigitalAssetMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editing?.title ?? "",
      description: editing?.description ?? "",
      category: editing?.category ?? "Other",
      productLine: editing?.productLine ?? undefined,
      assetType: editing?.assetType ?? "file",
      textContent: editing?.textContent ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: editing?.title ?? "",
        description: editing?.description ?? "",
        category: editing?.category ?? "Other",
        productLine: editing?.productLine ?? undefined,
        assetType: editing?.assetType ?? "file",
        textContent: editing?.textContent ?? "",
        status: (editing?.status === "archived" ? "archived" : "active") as "active" | "archived",
      });
      setFile(null);
    }
  }, [open, editing]);

  const assetType = form.watch("assetType");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        const body: any = { ...values, status: values.status ?? editing.status };
        await updateAsset({ id: editing._id, body }).unwrap();
        toast.success("Asset updated");
      } else {
        const fd = new FormData();
        fd.append("title", values.title);
        if (values.description) fd.append("description", values.description);
        fd.append("category", values.category);
        if (values.productLine) fd.append("productLine", values.productLine);
        fd.append("assetType", values.assetType);
        if (values.assetType === "text" && values.textContent) {
          fd.append("textContent", values.textContent);
        }
        if (values.assetType === "file" && file) {
          fd.append("file", file);
        }
        await createAsset(fd).unwrap();
        toast.success("Asset uploaded");
      }
      form.reset();
      setFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  }

  function handleClose() {
    form.reset();
    setFile(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] rounded-xs max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hidden">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Asset" : "Upload Asset"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 min-w-0">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input className="rounded-xs" placeholder="Asset title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xs w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Line</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="rounded-xs w-full">
                          <SelectValue placeholder="Any" />
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
            </div>

            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <div className="flex gap-2">
                    {(["file", "text"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className={`flex-1 py-1.5 rounded-xs text-sm border transition-colors ${
                          field.value === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-foreground"
                        }`}
                      >
                        {t === "file" ? "File (Upload)" : "Text (Copy)"}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {assetType === "file" ? (
              <div>
                <FormLabel>File</FormLabel>
                {editing?.fileUrl && !file && (
                  <div className="mt-1.5 mb-2 flex items-center gap-2 px-3 py-2 bg-muted rounded-xs border border-border">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground truncate flex-1">Current file: {editing.fileUrl.split("/").pop()}</span>
                    <a href={editing.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline shrink-0">View</a>
                  </div>
                )}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-1.5 border-2 border-dashed rounded-xs p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {editing?.fileUrl ? "Upload a replacement file, or leave empty to keep current" : <>Drag & drop or <span className="text-primary underline">browse</span></>}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Content</FormLabel>
                    <FormControl>
                      <Textarea
                        className="rounded-xs min-h-[100px]"
                        placeholder="Paste text, caption, or copy here..."
                        {...field}
                      />
                    </FormControl>
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
                  <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input className="rounded-xs" placeholder="Short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {editing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <div className="flex gap-2">
                      {(["active", "archived"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => field.onChange(s)}
                          className={`flex-1 py-1.5 rounded-xs text-sm border transition-colors ${
                            field.value === s
                              ? s === "active"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-destructive text-destructive-foreground border-destructive"
                              : "border-border text-muted-foreground hover:border-foreground"
                          }`}
                        >
                          {s === "active" ? "Active" : "Archived"}
                        </button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-xs" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xs" disabled={isLoading}>
                {isLoading ? (editing ? "Saving..." : "Uploading...") : editing ? "Save Changes" : "Upload Asset"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
