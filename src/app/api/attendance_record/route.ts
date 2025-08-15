import { NextRequest, NextResponse } from "next/server";
import { query } from "@/utils/db";

// GET with server-side pagination and filters
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 10)));
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to = url.searchParams.get("to");     // YYYY-MM-DD
    const onlyPresent = (url.searchParams.get("onlyPresent") || "false").toLowerCase() === "true";

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`LOWER(u.name) LIKE $${params.length}`);
    }

    if (from) {
      params.push(from);
      where.push(`(ar.check_in_time AT TIME ZONE 'America/La_Paz')::date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      where.push(`(ar.check_in_time AT TIME ZONE 'America/La_Paz')::date <= $${params.length}`);
    }

    if (onlyPresent) {
      where.push(`ar.check_out_time IS NULL`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Count total with same filters
    const countSql = `
      SELECT COUNT(*) AS total
      FROM AttendanceRecord ar
      JOIN Users u ON ar.id_user = u.id_user
      ${whereSql}
    `;
    const countRes = await query(countSql, params);
    const total = Number(countRes.rows?.[0]?.total || 0);

    // Pagination
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT ar.id_record, ar.id_user, u.name, ar.check_in_time, ar.check_out_time, ar.total_hours
      FROM AttendanceRecord ar
      JOIN Users u ON ar.id_user = u.id_user
      ${whereSql}
      ORDER BY ar.check_in_time DESC
      OFFSET $${params.length + 1} LIMIT $${params.length + 2}
    `;
    const dataRes = await query(dataSql, [...params, offset, pageSize]);

    return NextResponse.json({
      records: dataRes.rows,
      page,
      pageSize,
      total,
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
    console.log(userResult);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id_user;
    console.log(userId);
    // Verificar si ya existe un registro de entrada sin salida
    const attendanceQuery = `
SELECT * FROM AttendanceRecord
WHERE id_user = $1 AND check_out_time IS NULL
`;
    const attendanceResult = await query(attendanceQuery, [userId]);
    console.log("attendanceResult",attendanceResult);
    if (attendanceResult.rows.length === 0) {
      // Registrar entrada
      const insertQuery = `
  INSERT INTO AttendanceRecord (id_user, check_in_time, updated_at)
  VALUES ($1, NOW() AT TIME ZONE 'America/La_Paz', NOW() AT TIME ZONE 'America/La_Paz')
  RETURNING *
`;
//validar tiempo de respuesta de entrada y salida .......
      const insertResult = await query(insertQuery, [userId]);
      return NextResponse.json(
        {
          message: "Check-in registered",
          record: insertResult.rows[0],
        },
        { status: 201 }
      );
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
      console.log("updateResult",updateResult);
      return NextResponse.json(
        {
          message: "Check-out registered",
          record: updateResult.rows[0],
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error handling attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
