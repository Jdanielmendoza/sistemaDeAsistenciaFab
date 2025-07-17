import { NextRequest, NextResponse } from "next/server";
import { query } from "@/utils/db";

export async function GET() {
  try {
    const attendanceQuery = `
      SELECT ar.id_record, ar.id_user, u.name, ar.check_in_time, ar.check_out_time, ar.total_hours
      FROM AttendanceRecord ar
      JOIN Users u ON ar.id_user = u.id_user
      ORDER BY ar.check_in_time DESC
    `;
    const attendanceResult = await query(attendanceQuery);

    return NextResponse.json({
      message: "Attendance records retrieved successfully",
      records: attendanceResult.rows,
    });
  } catch (error) {
    console.error("Error retrieving attendance records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  const rfid = req.nextUrl.searchParams.get("rfid");

  if (!rfid) {
    return NextResponse.json({ error: "RFID is required" }, { status: 400 });
  }

  try {
    // Verificar si el usuario existe basado en el RFID
    const userQuery = `
SELECT id_user FROM Card WHERE name = $1
`;
    const userResult = await query(userQuery, [rfid]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id_user;

    // Verificar si ya existe un registro de entrada sin salida
    const attendanceQuery = `
SELECT * FROM AttendanceRecord
WHERE id_user = $1 AND check_out_time IS NULL
`;
    const attendanceResult = await query(attendanceQuery, [userId]);

    if (attendanceResult.rows.length === 0) {
      // Registrar entrada
      const insertQuery = `
  INSERT INTO AttendanceRecord (id_user, check_in_time, updated_at)
  VALUES ($1, NOW() AT TIME ZONE 'America/La_Paz', NOW() AT TIME ZONE 'America/La_Paz')
  RETURNING *
`;
//validar tiempo de respuesta de entrada y salida .......
      const insertResult = await query(insertQuery, [userId]);
      return NextResponse.json({
        message: "Check-in registered",
        record: insertResult.rows[0],
      });
    } else {
      // Registrar salida
      const recordId = attendanceResult.rows[0].id_record;

      const updateQuery = `
  UPDATE AttendanceRecord
  SET check_out_time = NOW() AT TIME ZONE 'America/La_Paz',
      total_hours = (NOW() AT TIME ZONE 'America/La_Paz') - check_in_time,
      updated_at = NOW() AT TIME ZONE 'America/La_Paz'
  WHERE id_record = $1
  RETURNING *
`;
      const updateResult = await query(updateQuery, [recordId]);

      return NextResponse.json({
        message: "Check-out registered",
        record: updateResult.rows[0],
      });
    }
  } catch (error) {
    console.error("Error handling attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
