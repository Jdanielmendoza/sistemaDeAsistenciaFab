"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CopyIcon, EyeIcon, MoreHorizontal, TrashIcon, Shield, GraduationCap, Phone as PhoneIcon, User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"

export type VolunteerRow = {
    id_user: string
    user_name: string
    email: string
    phone_number: string | number | null
    university_name: string | null
    role_name: string
}

export type TableMeta = {
    onDelete?: (volunteer: VolunteerRow) => void
}

export const volunteerColumns: ColumnDef<VolunteerRow, any>[] = [
    {
        accessorKey: "user_name",
        header: () => (
            <div className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <span>Usuario</span>
            </div>
        ),
        cell: ({ row }) => {
            const name = row.getValue<string>("user_name")
            const email = row.original.email
            return (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium truncate max-w-[200px]">{name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">{email}</div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "role_name",
        header: () => (
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Rol</span>
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="truncate max-w-[160px]">{row.getValue("role_name")}</span>
            </div>
        ),
    },
    {
        accessorKey: "university_name",
        header: () => (
            <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>Universidad</span>
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[180px]">{row.getValue("university_name") || "—"}</span>
            </div>
        ),
    },
    {
        accessorKey: "phone_number",
        header: () => (
            <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span>Teléfono</span>
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span>{row.getValue("phone_number") || "—"}</span>
            </div>
        ),
    },
    {
        id: "Acciones",
        enableHiding: false,
        cell: ({ row, table }) => {
            const volunteer = row.original
            const meta = table.options.meta as TableMeta | undefined
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={async () => {
                                await navigator.clipboard.writeText(volunteer.email)
                                toast.success("Correo copiado", { duration: 2000 })
                            }}
                        >
                            <CopyIcon /> Copiar Correo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <EyeIcon /> <Link href={`volunteers/${volunteer.id_user}`}>Ver perfil</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); meta?.onDelete?.(volunteer) }}>
                            <TrashIcon /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]


