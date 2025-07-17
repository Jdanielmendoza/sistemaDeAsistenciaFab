"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id?: string;
  name: string;
  email: string;
  role?: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // invalid json
        }
      }
    }
  }, []);

  if (!user) {
    return <p className="p-4">No hay información del usuario.</p>;
  }

  return (
    <div className="flex justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/avatars/shadcn.jpg" alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            {user.role && <p className="text-sm">Rol: {user.role}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 