import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface UploadComprovanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationId: string;
  onSuccess: () => void;
}

export function UploadComprovanteDialog({ open, onOpenChange, reconciliationId, onSuccess }: UploadComprovanteDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${reconciliationId}-${Date.now()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("client-portal-files").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("client-portal-files").getPublicUrl(filePath);
      void urlData; // public URL available if needed later

      const { error: updateError } = await supabase
        .from("client_reconciliations")
        .update({ status: "em_analise", sent_date: new Date().toISOString() })
        .eq("id", reconciliationId);
      if (updateError) throw updateError;

      toast.success("Comprovante enviado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar comprovante");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Comprovante de Pagamento</DialogTitle>
          <DialogDescription>Faça upload do comprovante para dar baixa no pagamento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo do Comprovante</Label>
            <Input id="file" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Enviando..." : "Enviar Comprovante"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
