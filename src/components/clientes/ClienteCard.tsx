import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, Mail, Phone, MapPin, FileText, Edit, Trash2 } from "lucide-react";

interface Cliente {
  id: string;
  company_name: string;
  cnpj: string;
  inscricao_estadual?: string;
  address?: string;
  phone?: string;
  email?: string;
  financial_contact?: string;
  observations?: string;
  cnpj_card_url?: string;
  aircraft?: string;
  logo_url?: string;
}

interface ClienteCardProps {
  cliente: Cliente;
  onView?: (cliente: Cliente) => void;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (id: string) => void;
}

export function ClienteCard({ cliente, onView, onEdit, onDelete }: ClienteCardProps) {
  const handleCardClick = () => {
    if (onView) {
      onView(cliente);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow group cursor-pointer relative overflow-hidden" onClick={handleCardClick}>
      <CardContent className="p-6 space-y-4">
        {/* Header com Logo/Ícone e Nome */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {cliente.logo_url ? (
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={cliente.logo_url} alt={cliente.company_name} />
                <AvatarFallback className="bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs text-foreground truncate">
                {cliente.company_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">CNPJ: {cliente.cnpj}</p>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(cliente);
                }}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(cliente.id);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-2">
          {cliente.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{cliente.phone}</span>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{cliente.email}</span>
            </div>
          )}
          {cliente.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{cliente.address}</span>
            </div>
          )}
        </div>

        {/* Badges de Informações Adicionais */}
        <div className="flex flex-wrap gap-2">
          {cliente.inscricao_estadual && (
            <Badge variant="outline" className="text-xs">
              I/E: {cliente.inscricao_estadual}
            </Badge>
          )}
          {cliente.aircraft && (
            <Badge variant="outline" className="text-xs">
              Aeronave: {cliente.aircraft}
            </Badge>
          )}
          {cliente.cnpj_card_url && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Cartão CNPJ
            </Badge>
          )}
        </div>

        {/* Contato Financeiro */}
        {cliente.financial_contact && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Contato Financeiro:</p>
            <p className="text-sm font-medium text-foreground">{cliente.financial_contact}</p>
          </div>
        )}

        {/* Observações */}
        {cliente.observations && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Observações:</p>
            <p className="text-sm text-foreground">{cliente.observations}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
