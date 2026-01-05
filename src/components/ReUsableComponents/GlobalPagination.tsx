import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GlobalPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
}

export const GlobalPagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
}: GlobalPaginationProps) => {
  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis-start");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-end");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      {/* Left side: Limit selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="w-[80px] border-accent rounded-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">per page</span>
      </div>

      {/* Right side: Page numbers */}
      <div className="flex flex-col items-center gap-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50 rounded-xs"
                    : "cursor-pointer rounded-xs"
                }
              />
            </PaginationItem>

            {pages.map((page, index) => {
              if (page === "ellipsis-start" || page === "ellipsis-end") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page as number)}
                    isActive={currentPage === page}
                    className={cn(
                      "cursor-pointer rounded-xs",
                      currentPage === page &&
                        "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50 rounded-xs"
                    : "cursor-pointer rounded-xs"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          items
        </div>
      </div>
    </div>
  );
};
