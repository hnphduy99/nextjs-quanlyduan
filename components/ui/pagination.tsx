import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];

  const siblingCount = 1;
  const totalNumbers = siblingCount * 2 + 5;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      for (let i = 1; i <= leftItemCount; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(lastPageIndex);
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      pages.push(firstPageIndex);
      pages.push("...");
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(firstPageIndex);
      pages.push("...");
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(lastPageIndex);
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-4", className)}>
      {/* First Page */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="hover:border-primary/50 h-8 w-8 transition-colors"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Prev Page */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="hover:border-primary/50 h-8 w-8 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      {pages.map((p, idx) => {
        if (p === "...") {
          return (
            <span
              key={`dots-${idx}`}
              className="text-muted-foreground flex h-8 w-8 items-center justify-center text-sm font-medium"
            >
              ...
            </span>
          );
        }

        const isCurrent = p === currentPage;
        return (
          <Button
            key={`page-${p}`}
            variant={isCurrent ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onPageChange(p as number)}
            className={cn(
              "h-8 w-8 font-semibold transition-all duration-300",
              isCurrent
                ? "bg-primary text-primary-foreground shadow-md hover:scale-105"
                : "hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            )}
          >
            {p}
          </Button>
        );
      })}

      {/* Next Page */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="hover:border-primary/50 h-8 w-8 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last Page */}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="hover:border-primary/50 h-8 w-8 transition-colors"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
