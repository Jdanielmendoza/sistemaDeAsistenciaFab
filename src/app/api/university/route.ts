import { query } from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query("SELECT * FROM university");
    return NextResponse.json(result?.rows,{status:200});
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error obteniendo universidades" + error,
      },
      { status: 500 }
    );
  }
}

export async function POST(req : Request) {
  try {
    const {name} = await req.json()
    const result = await query('INSERT INTO University (name) VALUES($1)',[name])
    console.log(result);
    return NextResponse.json({name},{status:201})
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error creando universidades" + error,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const {id, name } = await req.json();

    const result = await query("UPDATE University SET name = $1 WHERE id = $2 RETURNING *", [name,id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Universidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result?.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error actualizando Universidad' }, { status: 500 });
  }
}

export async function DELETE(req : Request){
  try {
    const {id} = await req.json();
    const result = await query('DELETE FROM University WHERE id=$1',[id]);
    console.log(result);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'universidad no encontrada' }, { status: 404 });
    }
    return NextResponse.json({message: "se elimino " + id},{status:200})
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error eliminando universidad" + error,
      },
      { status: 500 }
    );
  }
}