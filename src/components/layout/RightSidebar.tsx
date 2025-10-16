import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  FileText,
  Fuel,
  MapPin,
  Plane,
  Users,
  Wrench,
} from "lucide-react";
import Agendamento from "@/pages/Agendamento";
import PlanoVoo from "@/pages/PlanoVoo";

interface FlightOperation {
  label: string;
  icon: typeof Clock;
  color: "primary" | "secondary" | "accent";
  path?: string;
  componentName?: string;
}

type MaintenanceStatus = "urgent" | "normal" | "completed";

interface MaintenanceItem {
  label: string;
  icon: typeof Clock;
  status: MaintenanceStatus;
  path: string;
}

const maintenanceStatusConfig: Record<MaintenanceStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  urgent: { label: "Urgente", variant: "destructive" },
  normal: { label: "Em andamento", variant: "secondary" },
  completed: { label: "Concluído", variant: "default" },
};

export function RightSidebar() {
  const navigate = useNavigate();
  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const flightOperations: FlightOperation[] = [
    {
      label: "Agendamento",
      icon: Calendar,
      color: "primary",
      path: "/agendamento",
      componentName: Agendamento.name,
    },
    {
      label: "Plano de Voo",
      icon: MapPin,
      color: "secondary",
      path: "/plano-voo",
      componentName: PlanoVoo.name,
    },
    {
      label: "Diário de Bordo",
      icon: Plane,
      color: "accent",
      path: "/diario-bordo",
    },
    {
      label: "Controle de Abastecimento",
      icon: Fuel,
      color: "primary",
    },
    {
      label: "Gestão de Tripulação",
      icon: Users,
      color: "secondary",
      path: "/tripulacao",
    },
    {
      label: "Documentos",
      icon: FileText,
      color: "accent",
      path: "/documentos",
    },
  ];
  const maintenanceItems: MaintenanceItem[] = [
    {
      label: "Controle de Vencimentos",
      icon: Clock,
      status: "urgent",
      path: "/manutencao/vencimentos",
    },
    {
      label: "Programação Manutenção",
      icon: Calendar,
      status: "normal",
      path: "/manutencao/programacao",
    },
    {
      label: "Relatórios Técnicos",
      icon: FileText,
      status: "completed",
      path: "/manutencao/relatorios",
    },
  ];
  return <aside className="w-80 bg-background border-l border-border p-4 space-y-6">
      {/* Horário do Sistema */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            Horário do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{currentTime}</div>
            <div className="text-sm text-muted-foreground capitalize">{currentDate}</div>
          </div>
        </CardContent>
      </Card>

      {/* Operações de Voo */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center">
            <Plane className="mr-2 h-4 w-4 text-primary" />
            Operações de Voo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {flightOperations.map((operation, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start border-border hover:bg-accent hover:border-primary transition-smooth"
              aria-label={`Abrir ${operation.label}${operation.componentName ? ` - ${operation.componentName}` : ""}`}
              onClick={() => {
                if (operation.path) {
                  navigate(operation.path);
                }
              }}
            >
              <operation.icon className="mr-3 h-4 w-4 text-primary" />
              <span className="text-sm">{operation.label}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Manutenção */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center">
            <Wrench className="mr-2 h-4 w-4 text-primary" />
            Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {maintenanceItems.map((item, index) => {
            const statusConfig = maintenanceStatusConfig[item.status];

            return (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start border-border hover:bg-accent hover:border-primary transition-smooth"
                onClick={() => navigate(item.path)}
                aria-label={`Abrir ${item.label}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-4 w-4 text-primary" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </aside>;
}
