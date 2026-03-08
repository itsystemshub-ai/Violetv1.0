/**
 * CustomersPanel - Directorio de clientes del CRM
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Star,
  MessageCircle
} from "lucide-react";
import { useCRMStore } from "../hooks/useCRMStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

const MOCK_CUSTOMERS = [
  {
    id: "1",
    name: "Empresa ABC",
    contact: "Juan Pérez",
    email: "juan@empresa.com",
    phone: "+58 412-1234567",
    segment: "Enterprise",
    score: 95,
    status: "Active",
  },
  {
    id: "2",
    name: "Consultora Pro",
    contact: "Laura Martínez",
    email: "laura@consultora.com",
    phone: "+58 424-7654321",
    segment: "SME",
    score: 85,
    status: "Active",
  },
  {
    id: "3",
    name: "Tech Solutions",
    contact: "Roberto Sánchez",
    email: "roberto@tech.com",
    phone: "+58 414-9876543",
    segment: "Enterprise",
    score: 90,
    status: "Inactive",
  },
];

export default function CustomersPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const { setTab, setActiveChat } = useCRMStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, contacto o email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_CUSTOMERS.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {customer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">{customer.name}</h4>
                      <Badge
                        variant={
                          customer.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {customer.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Score: {customer.score}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {customer.segment}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Contacto
                    </span>
                    <span className="text-sm font-medium">
                      {customer.contact}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Email
                    </span>
                    <span className="text-sm">{customer.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    title="Chat WhatsApp"
                    onClick={() => {
                      setActiveChat(customer.id);
                      setTab("comunicaciones");
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar Datos</DropdownMenuItem>
                      <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
