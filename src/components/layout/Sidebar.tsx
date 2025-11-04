import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Settings,
  Building,
  Receipt,
  Plane,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuGroups = [
  {
    title: "Navegação Principal",
    items: [
      {
        title: "Início",
        icon: Home,
        href: "/",
        isMain: true,
      },
      {
        title: "Minhas Tarefas",
        icon: CheckSquare,
        href: "/minhas-tarefas",
      },
    ],
  },
  {
    title: "Agenda & Contatos",
    items: [
      {
        title: "Agenda",
        icon: Calendar,
        isExpandable: true,
        subItems: [
          { title: "Contatos", href: "/agenda/contatos" },
          { title: "Clientes/Cotistas", href: "/agenda/clientes" },
          { title: "Aniversários", href: "/agenda/aniversarios" },
        ],
      },
    ],
  },
  {
    title: "Financeiro & Cartões",
    items: [
      {
        title: "Portal Financeiro",
        icon: CreditCard,
        isExpandable: true,
        subItems: [
          { title: "Conciliação Bancária", href: "/financeiro/conciliacao" },
          { title: "Emissão de Recibo", href: "/financeiro/recibo" },
          { title: "Relatório de Viagem", href: "/financeiro/viagem" },
          { title: "Solicitação de Compras/Serviço", href: "/financeiro/compras" },
        ],
      },
      {
        title: "Saldo Cartão",
        icon: DollarSign,
        isExpandable: true,
        subItems: [
          { title: "Cartão Alimentação", href: "/cartao/alimentacao" },
          { title: "Cartão Combustível", href: "/cartao/combustivel" },
        ],
      },
    ],
  },
  {
    title: "Comunicação",
    items: [
      {
        title: "Recados",
        icon: MessageSquare,
        href: "/recados",
      },
    ],
  },
  {
    title: "Configurações",
    items: [
      {
        title: "Empresa",
        icon: Building,
        href: "/configuracoes/empresa",
      },
    ],
  },
  {
    title: "Administração",
    items: [
      {
        title: "Usuários",
        icon: Users,
        href: "/admin/usuarios",
      },
    ],
  },
];

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(["Agenda", "Portal Financeiro", "Saldo Cartão"]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-64 bg-background border-r border-border shadow-card">
      <div className="p-4 border-b border-border bg-gradient-card">
        <h2 className="text-foreground font-semibold bg-gradient-primary bg-clip-text text-transparent">
          Menu Principal
        </h2>
      </div>
      
      <nav className="p-3 space-y-4">
        {menuGroups.map((group) => (
          <Card 
            key={group.title} 
            className="bg-gradient-card border-border shadow-card hover:bg-accent transition-smooth"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center">
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {group.items.map((item) => (
                <div key={item.title}>
                  {item.isExpandable ? (
                    <Collapsible
                      open={expandedItems.includes(item.title)}
                      onOpenChange={() => toggleExpanded(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between border-border hover:bg-accent hover:border-primary transition-smooth"
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-4 w-4" />
                            {item.title}
                          </div>
                          {expandedItems.includes(item.title) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-4 mt-1 space-y-1">
                        {item.subItems?.map((subItem) => (
                          <NavLink
                            key={subItem.href}
                            to={subItem.href}
                            className={({ isActive }) =>
                              cn(
                                "block px-4 py-2 text-sm rounded-md border border-border hover:bg-accent hover:border-primary transition-smooth",
                                isActive
                                  ? "bg-custom-cyan text-white shadow-primary"
                                  : "text-foreground hover:bg-accent"
                              )
                            }
                          >
                            {subItem.title}
                          </NavLink>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <NavLink
                      to={item.href || "#"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-accent hover:border-primary transition-smooth",
                          isActive
                            ? "bg-custom-cyan text-white shadow-primary"
                            : "text-foreground hover:bg-accent"
                        )
                      }
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </NavLink>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </nav>
    </aside>
  );
}
