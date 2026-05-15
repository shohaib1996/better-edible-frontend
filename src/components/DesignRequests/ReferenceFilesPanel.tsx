import { FileText, ExternalLink, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IUploadedFile } from "@/types/designRequests/designRequests";

interface ReferenceFilesPanelProps {
  files: IUploadedFile[];
}

export function ReferenceFilesPanel({ files }: ReferenceFilesPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Reference Files
        </p>
        {files.length > 0 && (
          <Badge variant="outline" className="rounded-xs text-xs h-5">
            {files.length}
          </Badge>
        )}
      </div>

      <div className="p-3">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-xs bg-muted flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No reference files</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              The requester didn't attach any files.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li
                key={f._id}
                className="group flex items-center gap-2.5 bg-muted/40 hover:bg-muted/70 transition-colors rounded-xs px-3 py-2.5"
              >
                <div className="w-7 h-7 rounded-xs bg-background border border-border flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm truncate">{f.fileName}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                    title="Open"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={f.url}
                    download
                    className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
