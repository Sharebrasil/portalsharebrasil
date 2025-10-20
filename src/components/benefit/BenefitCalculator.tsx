import { useState, useEffect } from "react";
import { Plus, TrendingDown, Receipt, History, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  created_at: string;
}

interface BenefitCard {
  id: string;
  month: number;
  year: number;
  initial_balance: number;
}

interface BenefitCalculatorRealProps {
  title: string;
  cardType: 'alimentacao' | 'combustivel';
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Legacy interface for backward compatibility
interface BenefitCalculatorLegacyProps {
  title: string;
  month: string;
  initialBalance: number;
  onInitialBalanceChange: (balance: number) => void;
}

// Wrapper component for legacy interface
export function BenefitCalculator({ title, month, initialBalance, onInitialBalanceChange }: BenefitCalculatorLegacyProps) {
  // Determine card type from title
  const cardType: 'alimentacao' | 'combustivel' = title.toLowerCase().includes('combustível') || title.toLowerCase().includes('combustivel')
    ? 'combustivel'
    : 'alimentacao';

  return <BenefitCalculatorReal title={title} cardType={cardType} />;
}

export function BenefitCalculatorReal({ title, cardType }: BenefitCalculatorRealProps) {
  const [currentCard, setCurrentCard] = useState<BenefitCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [initialBalance, setInitialBalance] = useState(500);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadBenefitCard();
  }, [selectedMonth, selectedYear, cardType]);

  useEffect(() => {
    if (currentCard) {
      loadTransactions();
    }
  }, [currentCard]);

  const loadBenefitCard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('benefit_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_type', cardType)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast.error('Erro ao carregar cartão benefício');
      return;
    }

    if (data) {
      setCurrentCard(data);
      setInitialBalance(Number(data.initial_balance));
    } else {
      // Create new card
      const { data: newCard, error: createError } = await supabase
        .from('benefit_cards')
        .insert({
          user_id: user.id,
          card_type: cardType,
          month: selectedMonth,
          year: selectedYear,
          initial_balance: 500
        })
        .select()
        .single();

      if (createError) {
        toast.error('Erro ao criar cartão benefício');
        return;
      }

      setCurrentCard(newCard);
      setInitialBalance(500);
    }
  };

  const loadTransactions = async () => {
    if (!currentCard) return;

    const { data, error } = await supabase
      .from('benefit_transactions')
      .select('*')
      .eq('benefit_card_id', currentCard.id)
      .order('transaction_date', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar transações');
      return;
    }

    setTransactions(data || []);
  };

  const updateInitialBalance = async () => {
    if (!currentCard) return;

    const { error } = await supabase
      .from('benefit_cards')
      .update({ initial_balance: initialBalance })
      .eq('id', currentCard.id);

    if (error) {
      toast.error('Erro ao atualizar saldo inicial');
      return;
    }

    toast.success('Saldo inicial atualizado');
    setIsEditingBalance(false);
    loadBenefitCard();
  };

  const addTransaction = async () => {
    if (!currentCard || !newTransaction.description || !newTransaction.amount) return;

    const { error } = await supabase
      .from('benefit_transactions')
      .insert({
        benefit_card_id: currentCard.id,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        transaction_date: newTransaction.transaction_date,
      });

    if (error) {
      toast.error('Erro ao adicionar gasto');
      return;
    }

    toast.success('Gasto adicionado');
    setNewTransaction({
      description: "",
      amount: "",
      transaction_date: new Date().toISOString().split('T')[0],
    });
    loadTransactions();
  };

  const removeTransaction = async (id: string) => {
    const { error } = await supabase
      .from('benefit_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao remover gasto');
      return;
    }

    toast.success('Gasto removido');
    loadTransactions();
  };

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const availableBalance = initialBalance - totalSpent;
  const usagePercentage = initialBalance > 0 ? (totalSpent / initialBalance) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Ano</Label>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Principal */}
      <Card className="bg-gradient-to-br from-success to-success/80 text-white shadow-elevated border-0">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Receipt className="mr-2 h-6 w-6" />
              {title}
            </CardTitle>
            <p className="text-white/90 mt-1">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-white/90 text-sm">Saldo Disponível</p>
            <p className="text-4xl font-bold">
              R$ {availableBalance.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/90">Progresso de uso</span>
              <span className="text-white font-medium">{usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress
              value={usagePercentage}
              className="h-2 bg-white/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Saldo Inicial</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-bold text-foreground">
                R$ {initialBalance.toFixed(2).replace('.', ',')}
              </span>
              <Dialog open={isEditingBalance} onOpenChange={setIsEditingBalance}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Edit className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Saldo Inicial</DialogTitle>
                    <DialogDescription>
                      Insira o novo valor do saldo inicial
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="initialBalance">Valor (R$)</Label>
                      <Input
                        id="initialBalance"
                        type="number"
                        step="0.01"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={updateInitialBalance} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-muted-foreground text-sm">Total Gasto</p>
            <p className="text-2xl font-bold text-destructive">
              R$ {totalSpent.toFixed(2).replace('.', ',')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Gasto e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adicionar Gasto */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              Adicionar Gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Data</Label>
              <Input
                id="transactionDate"
                type="date"
                value={newTransaction.transaction_date}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, transaction_date: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseValue">Valor Gasto</Label>
              <Input
                id="expenseValue"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDescription">Descrição</Label>
              <Textarea
                id="expenseDescription"
                placeholder="Descreva o gasto..."
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border min-h-[80px]"
              />
            </div>

            <Button
              onClick={addTransaction}
              className="w-full bg-success hover:bg-success/90 text-white"
              disabled={!newTransaction.description || !newTransaction.amount}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Gasto
            </Button>
          </CardContent>
        </Card>

        {/* Histórico de Gastos */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-foreground">
              <History className="mr-2 h-5 w-5 text-primary" />
              Histórico de Gastos ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum gasto registrado</p>
                <p className="text-sm text-muted-foreground">Adicione o primeiro gasto para começar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <div className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransaction(transaction.id)}
                            className="text-destructive hover:text-destructive p-1 h-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="font-bold text-destructive">
                            R$ {Number(transaction.amount).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < transactions.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
