import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { query } from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const search = (body?.search ?? "").trim().toLowerCase();
    const from = body?.from as string | undefined; // YYYY-MM-DD
    const to = body?.to as string | undefined;     // YYYY-MM-DD
    const onlyPresent = Boolean(body?.onlyPresent ?? false);

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

    const dataSql = `
      SELECT ar.id_record, ar.id_user, u.name, u.email,
             ar.check_in_time, ar.check_out_time, ar.total_hours,
             COALESCE(uni.name, '') AS university_name,
             COALESCE(r.name, '') AS role_name
      FROM AttendanceRecord ar
      JOIN Users u ON ar.id_user = u.id_user
      LEFT JOIN University uni ON u.id_university = uni.id
      LEFT JOIN Role r ON u.id_role = r.id
      ${whereSql}
      ORDER BY ar.check_in_time DESC
    `;
    const dataRes = await query(dataSql, params);
    const rows = dataRes.rows || [];

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registros");

    sheet.columns = [
      { header: "id_record", key: "id_record", width: 14 },
      { header: "id_user", key: "id_user", width: 12 },
      { header: "name", key: "name", width: 22 },
      { header: "email", key: "email", width: 28 },
      { header: "university_name", key: "university_name", width: 22 },
      { header: "role_name", key: "role_name", width: 16 },
      { header: "check_in_date", key: "check_in_date", width: 14 },
      { header: "check_in_time", key: "check_in_time", width: 12 },
      { header: "check_out_date", key: "check_out_date", width: 14 },
      { header: "check_out_time", key: "check_out_time", width: 12 },
      { header: "total_hours_hhmmss", key: "total_hours_hhmmss", width: 18 },
      { header: "total_hours_decimal", key: "total_hours_decimal", width: 18 },
      { header: "overtime_hours_decimal", key: "overtime_hours_decimal", width: 20 },
      { header: "is_open_session", key: "is_open_session", width: 16 },
    ];

    const toDecimal = (interval: any): number => {
      if (!interval) return 0;
      if (typeof interval === "number") return interval;
      if (typeof interval === "string") {
        const parts = interval.split(":");
        if (parts.length >= 2) {
          const h = parseInt(parts[0] || "0", 10);
          const m = parseInt(parts[1] || "0", 10);
          const s = parts[2] ? parseInt(parts[2], 10) : 0;
          return h + m / 60 + s / 3600;
        }
        const maybe = parseFloat(interval);
        return isNaN(maybe) ? 0 : maybe;
      }
      if (typeof interval === "object") {
        const h = interval.hours || 0;
        const m = interval.minutes || 0;
        const s = interval.seconds || 0;
        const d = interval.days || 0;
        const mo = interval.months || 0;
        return h + m / 60 + s / 3600 + d * 24 + mo * 30 * 24;
      }
      return 0;
    };

    const TZ = "America/La_Paz";
    const formatLocal = (dateVal: any): { date: string | null; time: string | null } => {
      if (!dateVal) return { date: null, time: null };
      const d = new Date(dateVal);
      // YYYY-MM-DD using en-CA locale to get ISO-like local date
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      // HH:mm 24h
      const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
      return { date, time };
    };

    for (const r of rows) {
      const inLocal = formatLocal(r.check_in_time);
      const outLocal = formatLocal(r.check_out_time);
      const totalDecimal = toDecimal(r.total_hours);
      const overtimeDecimal = Math.max(0, totalDecimal - 8);
      sheet.addRow({
        id_record: r.id_record,
        id_user: r.id_user,
        name: r.name,
        email: r.email,
        university_name: r.university_name,
        role_name: r.role_name,
        check_in_date: inLocal.date,
        check_in_time: inLocal.time,
        check_out_date: outLocal.date,
        check_out_time: outLocal.time,
        total_hours_hhmmss: r.total_hours ?? "00:00:00",
        total_hours_decimal: Number(totalDecimal.toFixed(2)),
        overtime_hours_decimal: Number(overtimeDecimal.toFixed(2)),
        is_open_session: !r.check_out_time,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `asistencia_${new Date().toISOString().slice(0,10)}.xlsx`;
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


