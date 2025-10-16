import { useState, useEffect } from "react";
import { Plus, TrendingDown, Receipt, History, Trash2 } from "lucide-react";
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

interface Expense {
  id: string;
  name: string;
  value: number;
  description: string;
  category: string;
  date: Date;
}

interface BenefitCalculatorProps {
  title: string;
  month: string;
  initialBalance: number;
  onInitialBalanceChange: (value: number) => void;
}

export function BenefitCalculator({ 
  title, 
  month, 
  initialBalance, 
  onInitialBalanceChange 
}: BenefitCalculatorProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    value: "",
    description: "",
    category: "",
  });

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.value, 0);
  const availableBalance = initialBalance - totalSpent;
  const usagePercentage = initialBalance > 0 ? (totalSpent / initialBalance) * 100 : 0;

  const addExpense = () => {
    if (newExpense.name && newExpense.value) {
      const expense: Expense = {
        id: Date.now().toString(),
        name: newExpense.name,
        value: parseFloat(newExpense.value),
        description: newExpense.description,
        category: newExpense.category || "Geral",
        date: new Date(),
      };
      
      setExpenses(prev => [...prev, expense]);
      setNewExpense({ name: "", value: "", description: "", category: "" });
      setIsAddingExpense(false);
    }
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card className="bg-gradient-to-br from-success to-success/80 text-white shadow-elevated border-0">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Receipt className="mr-2 h-6 w-6" />
              {title}
            </CardTitle>
            <p className="text-white/90 mt-1">{month}</p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <Receipt className="h-4 w-4" />
          </Button>
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Editar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Definir Saldo Inicial</DialogTitle>
                    <DialogDescription>
                      Insira o valor do saldo inicial do cartão benefício
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
                        onChange={(e) => onInitialBalanceChange(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <Button className="w-full">Salvar</Button>
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
              <Label htmlFor="expenseName">Seu Nome</Label>
              <Input
                id="expenseName"
                placeholder="Digite seu nome"
                value={newExpense.name}
                onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
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
                value={newExpense.value}
                onChange={(e) => setNewExpense(prev => ({ ...prev, value: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDescription">Descrição</Label>
              <Textarea
                id="expenseDescription"
                placeholder="Descreva o que foi comprado..."
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background border-border min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseCategory">Categoria</Label>
              <Input
                id="expenseCategory"
                placeholder="Ex: Alimentação, Lanche, etc."
                value={newExpense.category}
                onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <Button 
              onClick={addExpense} 
              className="w-full bg-success hover:bg-success/90 text-white"
              disabled={!newExpense.name || !newExpense.value}
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
              Histórico de Gastos ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum gasto registrado</p>
                <p className="text-sm text-muted-foreground">Adicione o primeiro gasto para começar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expenses.map((expense, index) => (
                  <div key={expense.id}>
                    <div className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-foreground">{expense.name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpense(expense.id)}
                            className="text-destructive hover:text-destructive p-1 h-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{expense.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {expense.category}
                          </Badge>
                          <p className="font-bold text-destructive">
                            R$ {expense.value.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {expense.date.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {index < expenses.length - 1 && <Separator className="my-2" />}
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