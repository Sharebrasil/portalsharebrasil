import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationId: string;
  currentStatus: string;
  type: 'client' | 'crew';
  onUpdate: () => void;
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  reconciliationId,
  currentStatus,
  type,
  onUpdate
}: StatusUpdateDialogProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const clientStatusOptions = [
    { value: 'pendente', label: 'Pendente - Aguardando Envio' },
    { value: 'enviado', label: 'Enviado Email - Aguardando Pagamento' },
    { value: 'pago', label: 'Pago e Concluído' }
  ];

  const crewStatusOptions = [
    { value: 'pendente', label: 'Pendente - Aguardando Pagamento' },
    { value: 'pago', label: 'Pago e Concluído' }
  ];

  const statusOptions = type === 'client' ? clientStatusOptions : crewStatusOptions;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const table = type === 'client' ? 'client_reconciliations' : 'crew_reconciliations';
      const updateData: any = { status };

      // Adicionar datas baseado no status
      if (status === 'enviado' && type === 'client') {
        updateData.sent_date = new Date().toISOString();
      } else if (status === 'pago') {
        updateData.paid_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', reconciliationId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Novo Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}