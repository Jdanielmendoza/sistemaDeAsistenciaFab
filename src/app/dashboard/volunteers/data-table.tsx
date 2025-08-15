"use client"

import { useEffect, useMemo, useState } from "react"
import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Columns2Icon, Download, Plus } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { volunteerColumns, type VolunteerRow } from "./columns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AttendanceRaw = { id_record: string; id_user: string; check_in_time: string; check_out_time: string | null }

export default function VolunteersTable() {
    const [rows, setRows] = useState<VolunteerRow[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const selectionColumn = useMemo<ColumnDef<VolunteerRow>>((): ColumnDef<VolunteerRow> => ({
        id: "select",
        enableHiding: false,
        header: ({ table }) => {
            const someSelected = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
            return (
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={(e) => table.toggleAllPageRowsSelected(e.currentTarget.checked)}
                    aria-label="Seleccionar página"
                />
            )
        },
        cell: ({ row }) => (
            <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={row.getIsSelected()}
                onChange={row.getToggleSelectedHandler()}
                aria-label="Seleccionar fila"
            />
        ),
        size: 32,
    }), [])

    const columns = useMemo<ColumnDef<VolunteerRow>[]>(() => [selectionColumn, ...volunteerColumns], [selectionColumn])

    const table = useReactTable<VolunteerRow>({
        data: rows,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
        meta: {
            onDelete: async (volunteer: VolunteerRow) => {
                if (!window.confirm(`¿Eliminar a ${volunteer.user_name}?`)) return
                try {
                    const res = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_user: volunteer.id_user }) })
                    if (!res.ok) throw new Error("No se pudo eliminar")
                    toast.success(`Eliminado: ${volunteer.user_name}`)
                    await load()
                } catch (e) {
                    toast.error("Error eliminando voluntario")
                }
            },
        },
    })

    const load = async () => {
        setIsLoading(true)
        try {
            const [usersRes, attendanceRes] = await Promise.all([
                fetch("/api/users?role=voluntario"),
                fetch("/api/attendance_record"),
            ])
            const users: Array<VolunteerRow> = usersRes.ok ? await usersRes.json() : []
            const attendancePayload = attendanceRes.ok ? await attendanceRes.json() : { records: [] }
            const attendance: AttendanceRaw[] = Array.isArray(attendancePayload) ? attendancePayload : (attendancePayload?.records || [])

            const activeIds = new Set(
                attendance
                    .filter((r) => r.check_out_time === null)
                    .map((r) => r.id_user)
            )

            const enriched: VolunteerRow[] = users.map((u: any) => ({
                id_user: u.id_user,
                user_name: u.user_name,
                email: u.email,
                phone_number: u.phone_number ?? null,
                university_name: u.university_name ?? null,
                role_name: u.role_name,
            }))

            setRows(enriched)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const total = useMemo(() => table.getFilteredRowModel().rows.length, [table.getFilteredRowModel().rows.length])

    const universities = useMemo(() => {
        const set = new Set<string>()
        rows.forEach((r) => { if (r.university_name) set.add(r.university_name) })
        return Array.from(set)
    }, [rows])

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 py-4 flex-wrap">
                {/* Page size */}
                <Select value={String(table.getState().pagination?.pageSize ?? 10)} onValueChange={(v) => table.setPageSize(Number(v))}>
                    <SelectTrigger className="w-[70px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Buscar voluntario..."
                    value={(table.getColumn("user_name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => table.getColumn("user_name")?.setFilterValue(event.target.value)}
                    className="max-w-sm"
                />

                {/* Universidad filter */}
                <Select onValueChange={(v) => table.getColumn("university_name")?.setFilterValue(v === "all" ? "" : v)} defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Universidad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {universities.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Estado filter removido */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            <Columns2Icon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                                {column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
                <Button asChild>
                    <Link href="volunteers/create">
                        <Plus className="mr-2 h-4 w-4" /> Agregar voluntario
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
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
                        ) : isLoading ? (
                            <TableRow>
                                <TableCell colSpan={table.getAllColumns().length} className="h-24">
                                    <Skeleton className="h-8 mt-1" />
                                    <Skeleton className="h-8 mt-1" />
                                    <Skeleton className="h-8 mt-1" />
                                    <Skeleton className="h-8 mt-1" />
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                                    No hay resultados
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">{total} resultado(s)</div>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}


