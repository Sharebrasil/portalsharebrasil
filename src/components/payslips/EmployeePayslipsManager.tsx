import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";
import { PayslipUploadModal } from "./PayslipUploadModal";
import { toast } from "sonner";

export function EmployeePayslipsManager({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; email: string } | null>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .order("email");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Gerenciar Holerites - Selecione um Colaborador
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isLoading ? (
              <p className="col-span-full text-center text-muted-foreground">Carregando colaboradores...</p>
            ) : employees && employees.length > 0 ? (
              employees.map((employee) => (
                <Card
                  key={employee.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedEmployee({ id: employee.id, email: employee.email })}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{employee.full_name || employee.email}</p>
                      <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">Nenhum colaborador encontrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PayslipUploadModal
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
      />
    </>
  );
}
