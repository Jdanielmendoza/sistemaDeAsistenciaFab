'use client'

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import styled from 'styled-components';
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
import { useContext, useState } from 'react';

const formSchema = z.object({
    cardNumber: z.string().min(5, {
        message: "El número de tarjeta debe tener al menos 5 caracteres.",
    }),
    id_user:z.string().uuid()
});

const FormRFIDCard = () => {
    const { setTabSelected, userForm } = useContext(ContextSelectedTab);
    const [isLoading,setIsLoading] = useState(false); 
    const formCard = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cardNumber: "",
            id_user: userForm.getValues('id_user')
        },
    });

    const onSubmit =async (values: any) => {
         try {
                console.log(values?.id_user);
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
                if (!response.ok) {
                    console.log(response);
                    throw new Error("Error al registrar el tarjeta");
                }
                const data = await response.json();
                console.log("tarjeta registrada exitosamente:", data);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
                console.log("next step");
                setTabSelected(StepperSelected.Schedule); 
            }
    };

    return (
        <Form {...formCard}>
            <form onSubmit={formCard.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
                <Card className='w-full max-w-md min-h-48 p-4'>
                    <StyledWrapper>
                        <div className="visa-card">
                            <div className="logoContainer">
                                <Image src="/logoFablab.png" alt="logo Fablab" width={100} height={50} />
                            </div>
                            <FormField
                                control={formCard.control}
                                name="cardNumber"
                                render={({ field }) => (
                                    <FormItem className="number-container">
                                        <FormLabel className="input-label">Número de tarjeta</FormLabel>
                                        <FormControl>
                                            <Input className="inputstyle pt-4 pb-4" placeholder="XXXXXXXXXXX" {...field} autoFocus autoComplete='false' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="name-wrapper">
                                <label className="input-label" htmlFor="holderName">Voluntario</label>
                                <input className="inputstyle  " id="holderName" placeholder="nombre" type="text" autoComplete='off' disabled value={userForm.getValues('name')} />
                            </div>
                        </div>
                    </StyledWrapper>
                </Card>
                <Button type="submit" disabled={isLoading} className="w-full">Enviar</Button>
            </form>
        </Form>
    );
}

const StyledWrapper = styled.div`
  .visa-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    width: 100%;
    max-width: 450px;
    height: 280px;
    background: linear-gradient(44deg, #373cf5 0%, #ffffff 85%);
    border-radius: 10px;
    padding: 30px;
    font-family: Arial, Helvetica, sans-serif;
    position: relative;
    gap: 15px;
  }
  .logoContainer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: fit-content;
    position: absolute;
    top: 0;
    left: 0;
    padding: 18px;
  }
  .inputstyle {
    background-color: transparent;
    border: none;
    outline: none;
    color: white;
    caret-color: red;
    font-size: 24px;
    height: 24px;
    letter-spacing: 3px;
  }
  .number-container, .name-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .input-label {
    font-size: 12px;
    letter-spacing: 1.5px;
    color: #e2e2e2;
  }
  #holderName {
    font-size: 16px;
    width: 100%;
  }
`;

export default FormRFIDCard;
