"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type PaginationItem = number | "ellipsis"

function buildRange(start: number, end: number): number[] {
  const length = Math.max(0, end - start + 1)
  return Array.from({ length }, (_, idx) => start + idx)
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
  boundaryCount: number = 2,
): PaginationItem[] {
  const maxVisible = boundaryCount * 2 + siblingCount * 2 + 3
  if (totalPages <= maxVisible) {
    return buildRange(1, totalPages)
  }

  const firstPagesEnd = boundaryCount
  const lastPagesStart = Math.max(totalPages - boundaryCount + 1, 1)

  const firstPages = buildRange(1, firstPagesEnd)
  const lastPages = buildRange(lastPagesStart, totalPages)

  const start = Math.max(currentPage - siblingCount, firstPagesEnd + 1)
  const end = Math.min(currentPage + siblingCount, lastPagesStart - 1)

  const items: PaginationItem[] = [...firstPages]

  if (start > firstPagesEnd + 1) {
    items.push("ellipsis")
  }

  if (start <= end) {
    items.push(...buildRange(start, end))
  }

  if (end < lastPagesStart - 1) {
    items.push("ellipsis")
  }

  items.push(...lastPages)
  return items
}

export interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  siblingCount?: number
  boundaryCount?: number
  className?: string
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 2,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const items = useMemo(() => getPaginationItems(page, totalPages, siblingCount, boundaryCount), [page, totalPages, siblingCount, boundaryCount])

  return (
    <div className={className ?? "flex items-center justify-end space-x-2 py-4"}>
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {items.map((item, idx) =>
        item === "ellipsis" ? (
          <Button key={`ellipsis-${idx}`} variant="ghost" size="sm" disabled>
            ...
          </Button>
        ) : (
          <Button key={`page-${item}`} variant={item === page ? "default" : "outline"} size="sm" onClick={() => onPageChange(item)}>
            {item}
          </Button>
        ),
      )}
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default Pagination


