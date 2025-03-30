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
      
      const { id_user, start_date, end_date} = schedules[0];
      await query(queries.users.updateStartEndDateUser,[start_date,end_date, id_user]); 
      for (const schedule of schedules) {
        const { id_user, day_of_week, start_time, end_time} = schedule;
  
        const queryToCreateAnSchedule = `
          INSERT INTO Schedule (
            id_user, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
  
        const values = [
          id_user,
          day_of_week,
          start_time,
          end_time
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
