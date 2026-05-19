import { Store, User, Calendar, Package, Layout } from "lucide-react";
import { IDesignRequest } from "@/types/designRequests/designRequests";

interface RequestBriefPanelProps {
  request: IDesignRequest;
}

export function RequestBriefPanel({ request }: RequestBriefPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brief</p>
      </div>
      <div className="divide-y divide-border">
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1.5">Description</p>
          <p className="text-sm leading-relaxed">{request.description}</p>
        </div>
        {request.storeName && (
          <div className="px-4 py-3 flex items-center gap-2.5">
            <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Store</p>
              <p className="text-sm font-medium">{request.storeName}</p>
            </div>
          </div>
        )}
        {request.format && (
          <div className="px-4 py-3 flex items-center gap-2.5">
            <Layout className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Format</p>
              <p className="text-sm font-medium">{request.format}</p>
            </div>
          </div>
        )}
        {request.productLine && (
          <div className="px-4 py-3 flex items-center gap-2.5">
            <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Product Line</p>
              <p className="text-sm font-medium">{request.productLine}</p>
            </div>
          </div>
        )}
        <div className="px-4 py-3 flex items-center gap-2.5">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Submitted By</p>
            <p className="text-sm font-medium">{request.submittedByName}</p>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-2.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
            <p className="text-sm font-medium">
              {new Date(request.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
