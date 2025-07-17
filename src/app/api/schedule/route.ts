import { NextRequest, NextResponse } from "next/server";
import { query } from "@/utils/db";
import { queries } from "@/utils/queries";
export async function GET() {
  try {
    const queryToGetSchedule = "SELECT * FROM Schedule";
    const result = await query(queryToGetSchedule);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST: Create a new schedule
export async function POST(req: NextRequest) {
    try {
      const schedules = await req.json(); // Recibe un arreglo de objetos
      const results = [];
      
      const { start_date, end_date } = schedules[0];
      for (const schedule of schedules) {
        const { id_user, day_of_week, start_time, end_time} = schedule;
  
        const queryToCreateAnSchedule = `
          INSERT INTO Schedule (
            id_user, day_of_week, start_time, end_time, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `;
  
        const values = [
          id_user,
          day_of_week,
          start_time,
          end_time,
          start_date,
          end_date
        ];
  
        const result = await query(queryToCreateAnSchedule, values);
        results.push(result.rows[0]);
      }
  
      return NextResponse.json(results, { status: 201 });
    } catch (error) {
      console.error("Error creating schedules:", error);
      return NextResponse.json(
        { error: "Failed to create schedules" },
        { status: 500 }
      );
    }
  }

// PUT: update a single schedule row
export async function PUT(req: NextRequest) {
  try {
    const { id_schedule, day_of_week, start_time, end_time } = await req.json();
    if (!id_schedule) {
      return NextResponse.json({ error: 'id_schedule required' }, { status: 400 });
    }
    await query(
      `UPDATE Schedule
       SET day_of_week=$2,
           start_time=$3,
           end_time=$4,
           updated_at = NOW()
       WHERE id_schedule=$1`,
      [id_schedule, day_of_week, start_time, end_time]
    );
    return NextResponse.json({ message: 'updated' });
  } catch (error) {
    return NextResponse.json({ error: 'error updating schedule' }, { status: 500 });
  }
}

// DELETE: remove schedule row
export async function DELETE(req: NextRequest) {
  try {
    const { id_schedule } = await req.json();
    if (!id_schedule) {
      return NextResponse.json({ error: 'id_schedule required' }, { status: 400 });
    }
    await query('DELETE FROM Schedule WHERE id_schedule=$1', [id_schedule]);
    return NextResponse.json({ message: 'deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'error deleting schedule' }, { status: 500 });
  }
}
