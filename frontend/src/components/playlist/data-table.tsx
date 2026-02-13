"use client";

import React, { useEffect } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Spinner } from "../ui/spinner";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onEndReached?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onEndReached,
  hasMore,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Setup the observer
  const { containerRef, isVisible } = useIntersectionObserver({
    root: null,
    rootMargin: "200px",
    threshold: 0.1,
  });

  // Trigger load when visible
  useEffect(() => {
    if (isVisible && hasMore && !isLoading && onEndReached) {
      onEndReached();
    }
  }, [isVisible, hasMore, isLoading, onEndReached]);

  return (
    <div className="w-full space-y-4">
      <div className="bg-card border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Infinite Scroll Trigger --- */}
      {hasMore && (
        <div
          ref={containerRef}
          className="text-muted-foreground flex w-full items-center justify-center py-4"
        >
          {isLoading && (
            <div className="flex items-center">
              <Spinner />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
