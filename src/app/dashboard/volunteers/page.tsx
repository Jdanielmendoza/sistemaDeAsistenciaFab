"use client"

import { useEffect, useState } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Columns2Icon, CopyIcon, EditIcon, EyeIcon, MoreHorizontal, TrashIcon } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

type Volunteer = {
    id_user: string
    user_name: string
    email: string
    birthdate: string
    phone_number: number
    university_name: string
    role_name: string
}

const createColumns = (setOpen: React.Dispatch<React.SetStateAction<boolean>>, SetVolunteerSelected: React.Dispatch<React.SetStateAction<Volunteer>>): ColumnDef<Volunteer>[] => [
    {
        accessorKey: "user_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nombre
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="capitalize truncate max-w-[220px] ">{row.getValue("user_name")}</div>
        ),
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Correo
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "phone_number",
        header: () => "Teléfono",
        cell: ({ row }) => {
            return <div >{row.getValue("phone_number")}</div>
        },
    },
    {
        accessorKey: "university_name",
        header: "Universidad",
        cell: ({ row }) => (
            <div className="capitalize truncate max-w-[200px]">{row.getValue("university_name")}</div>
        ),
    },
    {
        id: "Acciones",
        enableHiding: false,
        cell: ({ row }) => {
            const Volunteer = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={async () => {
                                await navigator.clipboard.writeText(Volunteer.email)
                                toast.success("Se copio el correo al portapapeles", {
                                    duration: 3000,
                                    style: {
                                        background: '#bbf7d0',
                                    },
                                })
                            }}
                        >
                            <CopyIcon /> Copiar Correo

                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><EyeIcon /> <Link href={"volunteers/" + Volunteer.id_user}>Ver perfil</Link> </DropdownMenuItem>
                        <DropdownMenuItem>
                            <EditIcon /> <Link href={"volunteers/" + Volunteer.id_user}>Editar perfil</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); console.log(Volunteer.id_user); SetVolunteerSelected(Volunteer) }}>
                            <TrashIcon /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function DeleteConfirmation({
    open,
    setOpen,
    volunteerSelected,
    refreshVolunteers
}: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    volunteerSelected: Volunteer;
    refreshVolunteers: () => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => {
                        console.log("Eliminar usuario...");
                        try {
                            const response = await fetch("/api/users", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id_user: volunteerSelected.id_user }),
                            });

                            if (!response.ok) {
                                throw new Error("Error al eliminar el voluntario");
                            }

                            toast.success(`Eliminado: ${volunteerSelected.user_name}`, { duration: 3000 });

                            setOpen(false);
                            refreshVolunteers(); // Recargar la lista después de eliminar
                        } catch (error) {
                            toast.error("No se pudo eliminar el voluntario");
                            console.error(error);
                        }
                    }}>
                        Continuar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


function DataTableDemo() {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [volunteerSelected, setVolunteerSelected] = useState<Volunteer>(volunteers[0]);
    const [isLoading, setIsloading] = useState<Boolean>(false);
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [open, setOpen] = useState(false); //el dialog de eliminar voluntario
    const columns = createColumns(setOpen, setVolunteerSelected);
    const table = useReactTable<Volunteer>({
        data: volunteers,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const fetchVolunteers = async () => {
        try {
            setIsloading(true);
            const result = await fetch("/api/users?role=voluntario");
            const data = await result.json();
            setVolunteers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsloading(false);
        }
    }
    useEffect(() => {
        fetchVolunteers();
    }, [])
    return (
        <div className="w-full">
            <div className="flex items-center gap-2 py-4">
                <Input
                    placeholder="Filtrar nombres..."
                    value={(table.getColumn("user_name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("user_name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            <Columns2Icon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button><Link href="volunteers/create" >Agregar voluntario</Link> </Button>
            </div>
            <div className="rounded-md border">
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
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
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
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isLoading ? <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24"
                            >
                                <Skeleton className="h-8 mt-1" />
                                <Skeleton className="h-8 mt-1" />
                                <Skeleton className="h-8 mt-1" />
                                <Skeleton className="h-8 mt-1" />
                            </TableCell>
                        </TableRow> : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No hay resultados
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
            <DeleteConfirmation open={open} setOpen={setOpen} volunteerSelected={volunteerSelected}  refreshVolunteers={fetchVolunteers} />
        </div>

    )
}

export default function Page() {
    return <DataTableDemo />
}