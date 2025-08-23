import { NextRequest, NextResponse } from "next/server";
import { query } from "@/utils/db";

const WEBHOOK_URL = process.env.N8N_ATTENDANCE_WEBHOOK_URL ;

async function sendAttendanceWebhook(payload: any) {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to send webhook to n8n:", err);
  }
}

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
    // Obtener información extendida del usuario para el webhook
    const userInfoQuery = `
SELECT 
  u.id_user,
  u.name AS user_name,
  u.email,
  u.phone_number,
  u.birthdate,
  r.name AS role_name,
  COALESCE(uni.name, '') AS university_name,
  c.name AS card_rfid
FROM Users u
LEFT JOIN Role r ON u.id_role = r.id
LEFT JOIN University uni ON u.id_university = uni.id
LEFT JOIN Card c ON c.id_user = u.id_user
WHERE u.id_user = $1
`;
    const userInfoRes = await query(userInfoQuery, [userId]);
    const userInfo = userInfoRes.rows?.[0] || {};
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
      const record = insertResult.rows[0];
      // Enviar webhook (check-in)
      const checkInTimeIso = record?.check_in_time ? new Date(record.check_in_time).toISOString() : null;
      const checkInTimeLocal = record?.check_in_time ? new Date(record.check_in_time).toLocaleString("es-BO", { timeZone: "America/La_Paz" }) : null;
      await sendAttendanceWebhook({
        event: "check_in",
        source: "attendance_api",
        rfid,
        user: {
          id: userId,
          name: userInfo.user_name,
          email: userInfo.email,
          phone_number: userInfo.phone_number,
          birthdate: userInfo.birthdate,
          role: userInfo.role_name,
          university: userInfo.university_name,
          card_rfid: userInfo.card_rfid || rfid,
        },
        record: {
          id_record: record?.id_record,
          check_in_time_iso: checkInTimeIso,
          check_in_time_local: checkInTimeLocal,
          created_at: record?.created_at,
          updated_at: record?.updated_at,
        },
        server_timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          message: "Check-in registered",
          record,
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
      const record = updateResult.rows[0];
      const checkInTimeIso = record?.check_in_time ? new Date(record.check_in_time).toISOString() : null;
      const checkInTimeLocal = record?.check_in_time ? new Date(record.check_in_time).toLocaleString("es-BO", { timeZone: "America/La_Paz" }) : null;
      const checkOutTimeIso = record?.check_out_time ? new Date(record.check_out_time).toISOString() : null;
      const checkOutTimeLocal = record?.check_out_time ? new Date(record.check_out_time).toLocaleString("es-BO", { timeZone: "America/La_Paz" }) : null;
      await sendAttendanceWebhook({
        event: "check_out",
        source: "attendance_api",
        rfid,
        user: {
          id: userId,
          name: userInfo.user_name,
          email: userInfo.email,
          phone_number: userInfo.phone_number,
          birthdate: userInfo.birthdate,
          role: userInfo.role_name,
          university: userInfo.university_name,
          card_rfid: userInfo.card_rfid || rfid,
        },
        record: {
          id_record: record?.id_record,
          check_in_time_iso: checkInTimeIso,
          check_in_time_local: checkInTimeLocal,
          check_out_time_iso: checkOutTimeIso,
          check_out_time_local: checkOutTimeLocal,
          total_hours: record?.total_hours,
          created_at: record?.created_at,
          updated_at: record?.updated_at,
        },
        server_timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          message: "Check-out registered",
          record,
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
