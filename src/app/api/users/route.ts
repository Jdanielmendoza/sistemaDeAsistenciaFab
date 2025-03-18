import { NextResponse } from "next/server";
import { query } from "@/utils/db";
import bcrypt from "bcryptjs";
import { queries } from "@/utils/queries";

// GET: Obtener todos los usuarios
export async function GET() {
  try {
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
