import { NextResponse } from "next/server";
import { query } from "@/utils/db";

export async function GET() {
  try {
    // Total volunteers
    const totalVolunteersResult = await query(`SELECT COUNT(*) AS total FROM Users`);

    // Volunteers present today (checked-in without check-out)
    const presentVolunteersResult = await query(`
      SELECT COUNT(*) AS present
      FROM AttendanceRecord
      WHERE check_out_time IS NULL
        AND (check_in_time AT TIME ZONE 'America/La_Paz')::date = (NOW() AT TIME ZONE 'America/La_Paz')::date
    `);

    // Hours worked today (sum of total_hours / in-progress sessions counted until now)
    const hoursWorkedResult = await query(`
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (CASE
              WHEN total_hours IS NOT NULL THEN total_hours
              ELSE (NOW() AT TIME ZONE 'America/La_Paz') - check_in_time
            END)))/3600, 0) AS hours
      FROM AttendanceRecord
      WHERE (check_in_time AT TIME ZONE 'America/La_Paz')::date = (NOW() AT TIME ZONE 'America/La_Paz')::date
    `);

    // Unassigned RFID cards
    const unassignedCardsResult = await query(`SELECT COUNT(*) AS unassigned FROM Card WHERE id_user IS NULL`);

    return NextResponse.json(
      {
        totalVolunteers: Number(totalVolunteersResult.rows[0].total),
        presentVolunteers: Number(presentVolunteersResult.rows[0].present),
        hoursWorkedToday: Number(hoursWorkedResult.rows[0].hours),
        unassignedCards: Number(unassignedCardsResult.rows[0].unassigned),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 