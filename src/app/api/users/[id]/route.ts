import { NextResponse } from "next/server";
import { query } from "@/utils/db";

// GET: Obtener un usuario por ID (incluye nombres de rol y universidad)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await query(
      `SELECT u.id_user,
              u.name,
              u.email,
              u.birthdate,
              u.phone_number,
              u.id_role,
              r.name AS role_name,
              u.id_university,
              COALESCE(uni.name, '') AS university_name
       FROM Users u
       JOIN Role r ON u.id_role = r.id
       LEFT JOIN University uni ON u.id_university = uni.id
       WHERE u.id_user = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error obteniendo usuario por id" },
      { status: 500 }
    );
  }
}


