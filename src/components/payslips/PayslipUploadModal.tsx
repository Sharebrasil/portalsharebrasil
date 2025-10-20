import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface PayslipUploadModalProps {
  employee: { id: string; email: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayslipUploadModal({ employee, open, onOpenChange }: PayslipUploadModalProps) {
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const handleUpload = async () => {
    if (!employee || !month || !year || !file) {
      toast.error("Preencha todos os campos e selecione um arquivo");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${employee.id}/${year}/${month}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("employee-payslips")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("employee-payslips")
        .getPublicUrl(filePath);

      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: dbError } = await supabase
        .from("employee_payslips")
        .upsert({
          employee_id: employee.id,
          month: parseInt(month),
          year: parseInt(year),
          file_url: urlData.publicUrl,
          file_name: file.name,
          uploaded_by: authData.user?.id ?? null,
        });

      if (dbError) throw dbError;

      toast.success("Holerite enviado com sucesso!");
      onOpenChange(false);
      setMonth("");
      setFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Erro ao enviar holerite");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de Holerite - {employee?.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Arquivo do Holerite</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !month || !file}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Enviando..." : "Enviar Holerite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
