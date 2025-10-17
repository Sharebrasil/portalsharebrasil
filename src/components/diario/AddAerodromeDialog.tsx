import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddAerodromeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAerodromeDialog({ open, onOpenChange }: AddAerodromeDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    icao_code: "",
    coordenadas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('aerodromes').insert([{
        name: formData.name,
        icao_code: formData.icao_code.toUpperCase(),
        coordenadas: formData.coordenadas,
      }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Aeródromo adicionado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['aerodromes'] });
      onOpenChange(false);
      setFormData({ name: "", icao_code: "" , coordenadas ""});
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar aeródromo.",
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
          <DialogTitle>Adicionar Aeródromo</DialogTitle>
        </DialogHeader>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Caso a localidade não possua indicativo OACI, deverá ser preenchido o respectivo campo com o código ZZZZ, seguido do nome da localidade (fazenda, pista, área, prédio, hospital, lote etc), no campo de observações.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icao_code">DESIGNATIVO *</Label>
            <Input
              id="icao_code"
              value={formData.icao_code}
              onChange={(e) => setFormData({ ...formData, icao_code: e.target.value.toUpperCase() })}
              placeholder="SBSP"
              maxLength={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Aeródromo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Aeroporto de Congonhas"
              required
            />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coordenadas">COORDENADAS *</Label>
            <Input
              id="coordenadas"
              value={formData.coordenadas}
              onChange={(e) => setFormData({ ...formData, coordenadas: e.target.value.toUpperCase() })}
              placeholder="SBSP"
              maxLength={4}
              required

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
