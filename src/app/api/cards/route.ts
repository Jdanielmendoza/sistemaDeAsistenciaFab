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
        const { name, id_user } = await req.json(); 
        
        // Validate input
        if (!name || !id_user) {
            return NextResponse.json(
                { error: "Faltan datos requeridos: name y id_user son obligatorios" }, 
                { status: 400 }
            );
        }

        // Check if card name already exists
        const existingCardResult = await query(
            "SELECT id FROM Card WHERE name = $1", 
            [name]
        );
        if (existingCardResult.rows.length > 0) {
            return NextResponse.json(
                { error: "Esta tarjeta ya está registrada en el sistema" }, 
                { status: 409 }
            );
        }

        // Check if user already has a card
        const existingUserCardResult = await query(
            "SELECT id FROM Card WHERE id_user = $1", 
            [id_user]
        );
        if (existingUserCardResult.rows.length > 0) {
            return NextResponse.json(
                { error: "Este usuario ya tiene una tarjeta asignada" }, 
                { status: 409 }
            );
        }

        // Check if user exists
        const userResult = await query(
            "SELECT id_user FROM Users WHERE id_user = $1", 
            [id_user]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: "El usuario especificado no existe" }, 
                { status: 404 }
            );
        }

        // Create the card
        const result = await query(queries.cards.createCard,[name,id_user])
        
        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "No se pudo crear la tarjeta" }, 
                { status: 500 }
            );
        }
        
        return NextResponse.json(result.rows[0],{status : 201})
    } catch (error) {
        console.error("Error creating card:", error);
        
        // Handle specific PostgreSQL errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                if (error.message.includes('name')) {
                    return NextResponse.json(
                        { error: "Esta tarjeta ya está registrada" }, 
                        { status: 409 }
                    );
                }
                if (error.message.includes('id_user')) {
                    return NextResponse.json(
                        { error: "Este usuario ya tiene una tarjeta asignada" }, 
                        { status: 409 }
                    );
                }
            }
            if (error.message.includes('foreign key')) {
                return NextResponse.json(
                    { error: "El usuario especificado no existe" }, 
                    { status: 404 }
                );
            }
        }
        
        return NextResponse.json(
            { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` }, 
            { status: 500 }
        );
    }
}