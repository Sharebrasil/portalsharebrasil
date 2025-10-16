import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AddAircraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAircraftDialog({ open, onOpenChange }: AddAircraftDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    registration: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    owner_name: "",
    status: "Ativa",
    fuel_consumption: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('aircraft').insert([{
        registration: formData.registration,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial_number: formData.serial_number,
        owner_name: formData.owner_name,
        status: formData.status,
        fuel_consumption: formData.fuel_consumption ? parseFloat(formData.fuel_consumption) : null,
      }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Aeronave cadastrada com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      onOpenChange(false);
      setFormData({
        registration: "",
        manufacturer: "",
        model: "",
        serial_number: "",
        owner_name: "",
        status: "Ativa",
        fuel_consumption: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar aeronave.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Aeronave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registration">Matrícula *</Label>
            <Input
              id="registration"
              value={formData.registration}
              onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
              placeholder="PT-ABC"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Cessna"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="172"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Número de Série *</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="12345"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_name">Proprietário *</Label>
              <Input
                id="owner_name"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="Nome do Proprietário"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativa">Ativa</SelectItem>
                <SelectItem value="Inativa">Inativa</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_consumption">Consumo Médio (L/H)</Label>
            <Input
              id="fuel_consumption"
              type="number"
              step="0.1"
              value={formData.fuel_consumption}
              onChange={(e) => setFormData({ ...formData, fuel_consumption: e.target.value })}
              placeholder="83"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
