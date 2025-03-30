import { query } from "@/utils/db";
import { queries } from "@/utils/queries";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';


export async function GET() {
    try {
        const result = await query(queries.cards.getCards)
        return NextResponse.json(result.rows,{
            status: 200
        })
    } catch (error) {
        return NextResponse.json({error:"Error obteniendo tarjetas" + error },{status:500})
    }
}

export async function POST(req:Request) {
    try {
        const { name,id_user } = await req.json(); 
        const result = await query(queries.cards.createCard,[name,id_user])
        return NextResponse.json(result.rows[0],{status : 201})
    } catch (error) {
        return NextResponse.json({error : "error creando la tarjeta"+ error}, {status : 500})  
    }
}