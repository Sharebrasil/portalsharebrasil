import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CreateLogbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraft: Array<{
    id: string;
    registration: string;
    model: string;
  }>;
}

export function CreateLogbookDialog({ open, onOpenChange, aircraft }: CreateLogbookDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAircraft || !selectedYear) {
      toast.error("Selecione uma aeronave e um ano");
      return;
    }

    setLoading(true);

    try {
      const months = Array.from({ length: 12 }, (_, i) => ({
        aircraft_id: selectedAircraft,
        year: parseInt(selectedYear),
        month: i + 1,
        is_closed: false,
      }));

      const { error } = await supabase
        .from('logbook_months')
        .insert(months);

      if (error) {
        if (error.code === '23505') {
          toast.error("Diário de bordo já existe para este ano e aeronave");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Diário de bordo criado com sucesso!");

      const aircraftData = aircraft.find(a => a.id === selectedAircraft);
      if (aircraftData) {
        navigate(`/diario-bordo/${selectedAircraft}?year=${selectedYear}&month=1`);
      }

      onOpenChange(false);
      setSelectedAircraft("");
      setSelectedYear(currentYear.toString());
    } catch (error: any) {
      console.error("Erro ao criar diário de bordo:", error);
      toast.error(error.message || "Não foi possível criar o diário de bordo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Diário de Bordo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aircraft">Aeronave *</Label>
            <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a aeronave" />
              </SelectTrigger>
              <SelectContent>
                {aircraft.map((ac) => (
                  <SelectItem key={ac.id} value={ac.id}>
                    {ac.registration} - {ac.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Ano *</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Diário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
