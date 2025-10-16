import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { FlightPlanForm } from "@/components/plano-voo/FlightPlanForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlanoVooForm() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  if (!scheduleId) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="space-y-4 p-6 text-center text-muted-foreground">
              <p>Agendamento não encontrado.</p>
              <Button variant="outline" onClick={() => navigate("/plano-voo")}>Voltar para Plano de Voo</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <FlightPlanForm
          scheduleId={scheduleId}
          onCancel={() => navigate("/plano-voo")}
          onSuccess={() => navigate("/plano-voo")}
        />
      </div>
    </Layout>
  );
}
