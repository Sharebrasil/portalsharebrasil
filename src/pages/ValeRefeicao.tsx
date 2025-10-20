import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { BenefitCalculator } from "@/components/benefit/BenefitCalculator";

const ValeRefeicao = () => {
  return (
    <Layout>
      <div className="p-6">
        <BenefitCalculator
          title="Vale Refeição"
          month="Janeiro 2024"
          initialBalance={300}
          onInitialBalanceChange={() => {}}
        />
      </div>
    </Layout>
  );
};

export default ValeRefeicao;
