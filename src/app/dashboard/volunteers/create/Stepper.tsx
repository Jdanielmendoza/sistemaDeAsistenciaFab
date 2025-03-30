'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileForm from "./Form"
import { createContext, useState } from "react"
import FormRFIDCard from "./FormRFIDCard";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formUserSchema as formSchema } from "@/types/user";
import FormSchedule from "./FormSchedule";
export enum StepperSelected {
    Account = "account",
    Card = "card",
    Schedule = "schedule"
}
export const ContextSelectedTab = createContext<any>(null);
const Stepper = () => {
    const [tabSelected, setTabSelected] = useState<StepperSelected>(StepperSelected.Account);
    const userForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
      //      id_user: "",
            name: "",
            email: "",
            birthdate: new Date("2000-08-21"),
            password: "",
            id_role: "b72ae401-6234-4039-978b-a089f81d7e05",
        },
    })
    return (
        <ContextSelectedTab.Provider value={{ tabSelected, setTabSelected, userForm }} >
            <Tabs value={tabSelected} className="w-full">
                <TabsList className="w-full mb-3" >
                    <TabsTrigger className="w-full" disabled={tabSelected != "account"} value="account">
                        Crear cuenta
                    </TabsTrigger>
                    <TabsTrigger className="w-full" disabled={tabSelected != "card"} value="card">
                        Asignar tarjeta
                    </TabsTrigger>
                    <TabsTrigger className="w-full" disabled={tabSelected != "schedule"} value="schedule">
                        asignar horario
                    </TabsTrigger>
                </TabsList>
                <TabsContent value={StepperSelected.Account}>
                    <ProfileForm />
                </TabsContent>
                <TabsContent className="flex justify-center items-center" value={StepperSelected.Card}>
                    <FormRFIDCard />
                </TabsContent>
                <TabsContent value={StepperSelected.Schedule}>
                    <FormSchedule/>
                </TabsContent>
            </Tabs>
        </ContextSelectedTab.Provider>
    )
}

export default Stepper