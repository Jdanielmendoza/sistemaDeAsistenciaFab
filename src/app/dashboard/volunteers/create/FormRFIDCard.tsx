'use client'

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import LanyardWrapper from '@/components/LanyardWrapper';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ContextSelectedTab, StepperSelected } from './Stepper';
import { useContext, useState, useEffect } from 'react';

const formSchema = z.object({
    cardNumber: z.string().min(5, {
        message: "El número de tarjeta debe tener al menos 5 caracteres.",
    }),
    id_user:z.string().uuid()
});

const FormRFIDCard = () => {
    const { setTabSelected, userForm } = useContext(ContextSelectedTab);
    const [isLoading,setIsLoading] = useState(false); 
    const [cardData, setCardData] = useState({
        name: "daniel",
        cardNumber: "123456",
        logo: "/logoFablab.png"
    });
    const formCard = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cardNumber: "",
            id_user: userForm.getValues('id_user')
        },
    });

    // Watch form changes to update card preview
    const watchedCardNumber = formCard.watch('cardNumber');
    const userName = userForm.getValues('name');

    useEffect(() => {
        setCardData({
            name: userName || "NOMBRE DEL VOLUNTARIO",
            cardNumber: watchedCardNumber || "•••• •••• •••• ••••",
            logo: "/logoFablab.png"
        });
    }, [watchedCardNumber, userName]);

    const onSubmit =async (values: any) => {
         try {
                console.log("Form values:", values);
                console.log("User form values:", userForm.getValues());
                setIsLoading(true); 
                const response = await fetch("/api/cards", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name:values.cardNumber,
                        id_user:values?.id_user
                    }),
                });
               
               console.log("API Response status:", response.status);
               
                if (!response.ok) {
                   const errorData = await response.json().catch(() => response.text());
                   console.error("API Error Response:", errorData);
                   console.error("Status:", response.status, response.statusText);
                   const errorMessage = typeof errorData === 'object' && errorData.error 
                        ? errorData.error 
                        : errorData;
                   throw new Error(`Error al registrar la tarjeta (${response.status}): ${errorMessage}`);
                }
                const data = await response.json();
                console.log("tarjeta registrada exitosamente:", data);
                setTabSelected(StepperSelected.Schedule);
            } catch (error) {
                console.error("Error:", error);
                // Show user-friendly error message
                alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            } finally {
                setIsLoading(false);
            }
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Asignación de Tarjeta RFID</h2>
                <p className="text-muted-foreground">
                    Configura la tarjeta que será asignada a {userName || "este voluntario"}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Form */}
                <div className="space-y-6">
                    <Form {...formCard}>
                        <form onSubmit={formCard.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={formCard.control}
                                name="cardNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Tarjeta RFID</FormLabel>
                                        <FormControl>
                                            <Input 
                                                className="text-lg h-12" 
                                                placeholder="Ingresa el número de tarjeta" 
                                                {...field} 
                                                autoFocus 
                                                autoComplete='false' 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-sm text-muted-foreground">
                                            Este número identifica únicamente la tarjeta RFID
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <h4 className="font-medium">Información del Voluntario</h4>
                                <div className="text-sm space-y-1">
                                    <div><span className="font-medium">Nombre:</span> {userName || "No especificado"}</div>
                                    <div><span className="font-medium">ID:</span> {userForm.getValues('id_user')}</div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full h-12 text-lg"
                                size="lg"
                            >
                                {isLoading ? "Asignando..." : "Asignar Tarjeta"}
                            </Button>
                        </form>
                    </Form>
                </div>

                {/* Right: 3D Card Preview */}
                <div className="h-[600px] flex items-center justify-center">
                    <LanyardWrapper 
                        cardData={cardData}
                        className="w-full h-full"
                        use3D={true}
                        rotationSpeed={0.3}
                        rotationAxis="y"
                    />
                </div>
            </div>
        </div>
    );
}

export default FormRFIDCard;
