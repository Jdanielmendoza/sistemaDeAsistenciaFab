import { NextResponse } from "next/server";
import { query } from "@/utils/db";
import bcrypt from "bcryptjs";
import { queries } from "@/utils/queries";
import type { NextRequest } from "next/server";

// GET: Obtener todos los usuarios
export async function GET(req: NextRequest) {
  try {
    const roleParam = req.nextUrl.searchParams.get("role");

    if (roleParam) {
      // Sanitizar: solo letras y espacios
      const roleFiltered = roleParam.trim().toLowerCase();
      const result = await query(
        `SELECT u.id_user,
                u.name AS user_name,
                u.email,
                u.birthdate,
                u.phone_number,
                r.name AS role_name,
                COALESCE(uni.name, '') AS university_name
         FROM Users u
         JOIN Role r ON u.id_role = r.id
         LEFT JOIN University uni ON u.id_university = uni.id
         WHERE LOWER(r.name) = $1`,
        [roleFiltered]
      );
      return NextResponse.json(result.rows, { status: 200 });
    }

    // Sin filtro devuelve todos
    const result = await query(queries.users.getAllUsers);
    return NextResponse.json(result?.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error obteniendo usuarios" + error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      birthdate,
      password,
      phone_number,
      id_role,
      id_university,
    } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(queries.users.insertUser, [
      name,
      email,
      birthdate,
      hashedPassword,
      phone_number,
      id_role,
      id_university,
    ]);

    return NextResponse.json(result?.rows[0], { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error creando usuario : " + error },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un usuario por ID
export async function PUT(req: Request) {
  try {
    const {
      id_user,
      name,
      email,
      birthdate,
      phone_number,
      id_role,
      id_university,
    } = await req.json();

    const result = await query(queries.users.updateUser, [
      id_user,
      name,
      email,
      birthdate,
      phone_number,
      id_role,
      id_university,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result?.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error actualizando usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id_user } = await req.json();

    const result = await query(queries.users.deleteUser, [id_user]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Usuario eliminado" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error eliminando usuario" },
      { status: 500 }
    );
  }
}
