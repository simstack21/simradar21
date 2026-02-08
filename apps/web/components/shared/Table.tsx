import {
	type Column,
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type PaginationState,
	type SortingState,
	type Table,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from "../ui/table";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	rowCount: number;
	pagination: PaginationState;
	setPagination: OnChangeFn<PaginationState>;
}

export function DataTable<TData, TValue>({ columns, data, rowCount, pagination, setPagination }: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const table = useReactTable({
		data,
		columns,
		rowCount: rowCount,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: setPagination,
		manualPagination: true,
		state: {
			sorting,
			columnFilters,
			pagination,
		},
	});

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center">
				<Input
					placeholder="Type to filter... (Coming soon)"
					value={(table.getColumn("callsign")?.getFilterValue() as string) ?? ""}
					onChange={(event) => table.getColumn("callsign")?.setFilterValue(event.target.value)}
					className="w-full sm:max-w-xs"
					disabled
				/>
			</div>
			<div className="overflow-hidden rounded-md border">
				<UITable>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</UITable>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}

interface TableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: TableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<div className={cn("flex items-center gap-2 ml-0.5", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="sm" className="data-[state=open]:bg-accent -ml-3 h-8">
							<span>{title}</span>
							{column.getIsSorted() === "desc" ? <ArrowDown /> : column.getIsSorted() === "asc" ? <ArrowUp /> : <ChevronsUpDown />}
						</Button>
					}
				></DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
						<ArrowUp />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
						<ArrowDown />
						Desc
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

interface TablePaginationProps<TData> {
	table: Table<TData>;
}

function DataTablePagination<TData>({ table }: TablePaginationProps<TData>) {
	return (
		<div className="flex items-center justify-between px-2">
			<div className="flex items-center justify-center sm:justify-end w-full space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2 mr-0 sm:mr-2">
					<p className="text-sm font-medium hidden sm:inline">Rows per page</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-17.5">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 25, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-25 items-center justify-center text-sm font-medium mr-0 sm:mr-2">
					Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount().toLocaleString()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.firstPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to first page</span>
						<ChevronsLeftIcon />
					</Button>
					<Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon />
					</Button>
					<Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
						<span className="sr-only">Go to next page</span>
						<ChevronRightIcon />
					</Button>
					<Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
						<span className="sr-only">Go to last page</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>
	);
}
