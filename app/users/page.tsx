"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersDataTable } from "@/components/data-tables/users-data-table"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Systemka  Maamulka Dugsiga</h1>
            <p className="text-muted-foreground">
            Maamul waaxyaha Xarumaha, fasallada, ardayda, koorsooyinka, iyo isticmaalayaasha systemka.
            </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
 

          <TabsContent value="users">
            <UsersDataTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
