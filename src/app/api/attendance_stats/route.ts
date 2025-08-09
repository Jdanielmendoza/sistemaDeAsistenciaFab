import { NextRequest, NextResponse } from "next/server";
import { query } from "@/utils/db";

function hoursLabel(date: Date) {
  return date.toLocaleString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/La_Paz",
  });
}

export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get("period") || "today").toLowerCase();

  try {
    const totalVolRes = await query("SELECT COUNT(*) AS total FROM Users");
    const totalVolunteers = Number(totalVolRes.rows[0].total);

    if (period === "today") {
      // Entradas por hora
      const checkInsRes = await query(`
        SELECT date_trunc('hour', check_in_time AT TIME ZONE 'America/La_Paz') AS ts,
               COUNT(*) AS entradas
        FROM AttendanceRecord
        WHERE (check_in_time AT TIME ZONE 'America/La_Paz')::date = (NOW() AT TIME ZONE 'America/La_Paz')::date
        GROUP BY ts
        ORDER BY ts
      `);

      // Salidas por hora
      const checkOutsRes = await query(`
        SELECT date_trunc('hour', check_out_time AT TIME ZONE 'America/La_Paz') AS ts,
               COUNT(*) AS salidas
        FROM AttendanceRecord
        WHERE check_out_time IS NOT NULL
          AND (check_out_time AT TIME ZONE 'America/La_Paz')::date = (NOW() AT TIME ZONE 'America/La_Paz')::date
        GROUP BY ts
        ORDER BY ts
      `);

      const map = new Map<string, { entradas: number; salidas: number }>();
      
      // Initialize map with all hours of the day (0-23)
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        map.set(`${hour}:00`, { entradas: 0, salidas: 0 });
      }
      
      checkInsRes.rows.forEach((r) => {
        const label = hoursLabel(r.ts);
        map.set(label, { entradas: Number(r.entradas), salidas: 0 });
      });
      checkOutsRes.rows.forEach((r) => {
        const label = hoursLabel(r.ts);
        const obj = map.get(label) || { entradas: 0, salidas: 0 };
        obj.salidas = Number(r.salidas);
        map.set(label, obj);
      });

      // Convert to sorted array
      const chart = Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hora, vals]) => ({ hora, entradas: vals.entradas, salidas: vals.salidas }));

      const asistencias = chart.reduce((sum, c) => sum + c.entradas, 0);
      const ausencias = totalVolunteers - asistencias;

      const hoursRes = await query(`
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (CASE
                  WHEN total_hours IS NOT NULL THEN total_hours
                  ELSE (NOW() AT TIME ZONE 'America/La_Paz') - check_in_time
               END)))/3600,0) AS hours,
               COALESCE(SUM(EXTRACT(EPOCH FROM GREATEST(total_hours - interval '8 hours', interval '0')))/3600,0) AS overtime
        FROM AttendanceRecord
        WHERE (check_in_time AT TIME ZONE 'America/La_Paz')::date = (NOW() AT TIME ZONE 'America/La_Paz')::date
      `);

      return NextResponse.json(
        {
          period: "today",
          chart,
          stats: {
            asistencias,
            ausencias,
            horas_totales: Number(hoursRes.rows[0].hours),
            horas_extras: Number(hoursRes.rows[0].overtime),
          },
        },
        { status: 200 }
      );
    }

    if (period === "week") {
      // Generate last 7 days labels starting Monday of current week (ISO)
      const startOfWeekRes = await query("SELECT date_trunc('week', (NOW() AT TIME ZONE 'America/La_Paz')) AS start");
      const startOfWeek = new Date(startOfWeekRes.rows[0].start);

      // Entradas y salidas por día de la semana actual
      const entradasWeekRes = await query(`
        SELECT (check_in_time AT TIME ZONE 'America/La_Paz')::date AS day,
               COUNT(DISTINCT id_user) AS entradas
        FROM AttendanceRecord
        WHERE (check_in_time AT TIME ZONE 'America/La_Paz')::date >= (date_trunc('week', (NOW() AT TIME ZONE 'America/La_Paz')))::date
          AND (check_in_time AT TIME ZONE 'America/La_Paz')::date < (date_trunc('week', (NOW() AT TIME ZONE 'America/La_Paz')) + interval '7 day')::date
        GROUP BY day
      `);

      const salidasWeekRes = await query(`
        SELECT (check_out_time AT TIME ZONE 'America/La_Paz')::date AS day,
               COUNT(DISTINCT id_user) AS salidas
        FROM AttendanceRecord
        WHERE check_out_time IS NOT NULL
          AND (check_out_time AT TIME ZONE 'America/La_Paz')::date >= (date_trunc('week', (NOW() AT TIME ZONE 'America/La_Paz')))::date
          AND (check_out_time AT TIME ZONE 'America/La_Paz')::date < (date_trunc('week', (NOW() AT TIME ZONE 'America/La_Paz')) + interval '7 day')::date
        GROUP BY day
      `);

      const entradasMap = new Map<string, number>();
      entradasWeekRes.rows.forEach((r) => {
        const d = new Date(r.day);
        const label = d.toLocaleDateString("es-BO", { weekday: "short" });
        entradasMap.set(label, Number(r.entradas));
      });

      const salidasMap = new Map<string, number>();
      salidasWeekRes.rows.forEach((r) => {
        const d = new Date(r.day);
        const label = d.toLocaleDateString("es-BO", { weekday: "short" });
        salidasMap.set(label, Number(r.salidas));
      });

      const weekDays = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
      const chart = weekDays.map((wd) => {
        const name = wd.charAt(0).toUpperCase() + wd.slice(1);
        return {
          name,
          entradas: entradasMap.get(name.toLowerCase()) || 0,
          salidas: salidasMap.get(name.toLowerCase()) || 0,
        };
      });

      const totalEntradas = chart.reduce((s, d) => s + d.entradas, 0);
      const totalSalidas = chart.reduce((s, d) => s + d.salidas, 0);

      return NextResponse.json(
        {
          period: "week",
          chart,
          stats: {
            entradas: totalEntradas,
            salidas: totalSalidas,
          },
        },
        { status: 200 }
      );
    }

    // month stats (current month grouped by week number)
    const entradasMonthRes = await query(`
      SELECT 
        CASE 
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 7 THEN 1
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 14 THEN 2
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 21 THEN 3
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 28 THEN 4
          ELSE 5
        END AS week_no,
             COUNT(*) AS entradas
      FROM AttendanceRecord
      WHERE date_trunc('month', check_in_time AT TIME ZONE 'America/La_Paz') = date_trunc('month', NOW() AT TIME ZONE 'America/La_Paz')
      GROUP BY week_no
      ORDER BY week_no
    `);

    const salidasMonthRes = await query(`
      SELECT 
        CASE 
          WHEN EXTRACT(day FROM check_out_time AT TIME ZONE 'America/La_Paz') <= 7 THEN 1
          WHEN EXTRACT(day FROM check_out_time AT TIME ZONE 'America/La_Paz') <= 14 THEN 2
          WHEN EXTRACT(day FROM check_out_time AT TIME ZONE 'America/La_Paz') <= 21 THEN 3
          WHEN EXTRACT(day FROM check_out_time AT TIME ZONE 'America/La_Paz') <= 28 THEN 4
          ELSE 5
        END AS week_no,
             COUNT(*) AS salidas
      FROM AttendanceRecord
      WHERE check_out_time IS NOT NULL
        AND date_trunc('month', check_out_time AT TIME ZONE 'America/La_Paz') = date_trunc('month', NOW() AT TIME ZONE 'America/La_Paz')
      GROUP BY week_no
      ORDER BY week_no
    `);

    const entradasMapM = new Map<number, number>();
    entradasMonthRes.rows.forEach((r) => entradasMapM.set(Number(r.week_no), Number(r.entradas)));

    const salidasMapM = new Map<number, number>();
    salidasMonthRes.rows.forEach((r) => salidasMapM.set(Number(r.week_no), Number(r.salidas)));

    // Get the actual weeks that have data
    const allWeekNumbers = new Set([
      ...entradasMapM.keys(),
      ...salidasMapM.keys()
    ]);
    
    const maxWeek = allWeekNumbers.size > 0 ? Math.max(...allWeekNumbers) : 0;
    const weeksInMonth = Math.max(maxWeek, 4); // At least 4 weeks, up to 5 if there's data

    const chart = Array.from({ length: weeksInMonth }, (_, idx) => {
      const weekNo = idx + 1;
      return {
        semana: `Semana ${weekNo}`,
        entradas: entradasMapM.get(weekNo) || 0,
        salidas: salidasMapM.get(weekNo) || 0,
      };
    });

    const totEntradas = chart.reduce((s, d) => s + d.entradas, 0);
    const totSalidas = chart.reduce((s, d) => s + d.salidas, 0);

    return NextResponse.json(
      {
        period: "month",
        chart,
        stats: {
          entradas: totEntradas,
          salidas: totSalidas,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating attendance stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 