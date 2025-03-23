'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileForm from "./Form"
import { createContext, useState } from "react"
import FormRFIDCard from "./FormRFIDCard";
export enum StepperSelected {
    Account = "account",
    Card = "card",
    Schedule = "schedule"
}
export const ContextSelectedTab = createContext<any>(null);
const Stepper = () => {
    const [tabSelected, setTabSelected] = useState<StepperSelected>(StepperSelected.Account);

    return (
        <ContextSelectedTab.Provider value={{tabSelected, setTabSelected}} >
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
                <TabsContent value={StepperSelected.Card}>
                    <FormRFIDCard/>
                </TabsContent>
                <TabsContent value={StepperSelected.Schedule}>
                    Change your schedule
                </TabsContent>
            </Tabs>
        </ContextSelectedTab.Provider>
    )
}

export default Stepper