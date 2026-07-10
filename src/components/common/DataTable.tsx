"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  toolbarAction?: ReactNode;
  rowActions?: (row: Row<TData>) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingRows?: number;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  enablePagination?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  initialPageSize?: number;
  className?: string;
  tableClassName?: string;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  enableSearch = true,
  toolbarAction,
  rowActions,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your search or filters.",
  loadingRows = 5,
  getRowId,
  enablePagination = true,
  manualPagination = false,
  pageCount,
  pagination,
  onPaginationChange,
  initialPageSize = 10,
  className,
  tableClassName,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalSearch, setInternalSearch] = useState("");
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const globalFilter = searchValue ?? internalSearch;
  const tablePagination = pagination ?? internalPagination;

  const tableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!rowActions) {
      return columns;
    }

    return [
      ...columns,
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {rowActions(row)}
          </div>
        ),
      },
    ];
  }, [columns, rowActions]);

  // TanStack Table intentionally returns non-memoizable functions from this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      pagination: tablePagination,
    },
    pageCount,
    manualPagination,
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: onSearchChange ?? setInternalSearch,
    onPaginationChange: onPaginationChange ?? setInternalPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enablePagination && !manualPagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
  });

  const visibleColumnCount = table.getAllLeafColumns().length || 1;
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("space-y-3", className)}>
      {(enableSearch || toolbarAction) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {enableSearch ? (
            <SearchInput
              value={globalFilter}
              onChange={(value) => table.setGlobalFilter(value)}
              placeholder={searchPlaceholder}
              className="sm:max-w-xs"
            />
          ) : (
            <div />
          )}
          {toolbarAction ? <div className="shrink-0">{toolbarAction}</div> : null}
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-[#FFAA83] bg-white shadow-sm">
        <Table
          className={cn(
            "min-w-full [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[14px]",
            tableClassName
          )}
        >
          <TableHeader className="bg-[#FFEADE]/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[#FFAA83] hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      className="h-11 px-3 text-[14px] font-semibold text-[#3F0000]"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-ml-2 h-8 rounded-xl px-2 text-[14px] font-semibold text-[#3F0000] hover:bg-white/70"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sortDirection === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : sortDirection === "desc" ? (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUpDown className="size-3.5" aria-hidden="true" />
                          )}
                        </Button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-[#FFAA83]">
                  {Array.from({ length: visibleColumnCount }).map((__, cellIndex) => (
                    <TableCell key={cellIndex} className="px-3 py-3">
                      <Skeleton className="h-5 w-full rounded-full bg-[#FFAA83]/50" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="border-[#FFAA83] text-[#3F0000] hover:bg-[#FFEADE]/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="p-4">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    className="min-h-36 border-0 shadow-none"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination ? (
        <div className="flex flex-col gap-2 text-[14px] text-[#737373] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(table.getPageCount(), 1)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
