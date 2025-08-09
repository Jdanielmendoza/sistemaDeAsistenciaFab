import { NextResponse } from "next/server";
import { query } from "@/utils/db";

export async function GET() {
  try {
    // Test the month query
    const entradasMonthRes = await query(`
      SELECT 
        CASE 
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 7 THEN 1
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 14 THEN 2
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 21 THEN 3
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 28 THEN 4
          ELSE 5
        END AS week_no,
        COUNT(DISTINCT id_user) AS entradas
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
        COUNT(DISTINCT id_user) AS salidas
      FROM AttendanceRecord
      WHERE check_out_time IS NOT NULL
        AND date_trunc('month', check_out_time AT TIME ZONE 'America/La_Paz') = date_trunc('month', NOW() AT TIME ZONE 'America/La_Paz')
      GROUP BY week_no
      ORDER BY week_no
    `);

    // Also get some sample data to see what we have
    const sampleData = await query(`
      SELECT 
        id_record,
        id_user,
        check_in_time,
        check_out_time,
        EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') as day_of_month,
        CASE 
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 7 THEN 1
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 14 THEN 2
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 21 THEN 3
          WHEN EXTRACT(day FROM check_in_time AT TIME ZONE 'America/La_Paz') <= 28 THEN 4
          ELSE 5
        END AS calculated_week
      FROM AttendanceRecord
      WHERE date_trunc('month', check_in_time AT TIME ZONE 'America/La_Paz') = date_trunc('month', NOW() AT TIME ZONE 'America/La_Paz')
      LIMIT 10
    `);

    return NextResponse.json({
      entradas: entradasMonthRes.rows,
      salidas: salidasMonthRes.rows,
      sampleData: sampleData.rows,
      currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    });
  } catch (error) {
    console.error("Error debugging month data:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
} 