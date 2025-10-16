import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { BenefitCalculator } from "@/components/benefit/BenefitCalculator";

const ValeRefeicao = () => {
  const [initialBalance, setInitialBalance] = useState(300.00);

  return (
    <Layout>
      <div className="p-6">
        <BenefitCalculator
          title="Vale Refeição - Janeiro 2024"
          month="Janeiro 2024"
          initialBalance={initialBalance}
          onInitialBalanceChange={setInitialBalance}
        />
      </div>
    </Layout>
  );
};

export default ValeRefeicao;