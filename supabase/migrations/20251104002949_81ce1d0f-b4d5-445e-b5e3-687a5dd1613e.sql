-- Create bank_reconciliations table
CREATE TABLE public.bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Referência ao tipo de documento
  reference_type TEXT NOT NULL CHECK (reference_type IN ('travel_report', 'receipt', 'expense')),
  reference_id UUID NOT NULL,
  
  -- Dados da transação
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  bank_account TEXT,
  
  -- Status e controle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  
  -- Quem criou e quem aprovou
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Observações
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all reconciliations
CREATE POLICY "Authenticated users can view reconciliations"
ON public.bank_reconciliations
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can create reconciliations
CREATE POLICY "Authenticated users can create reconciliations"
ON public.bank_reconciliations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy: Only financial roles can update status to paid/completed
CREATE POLICY "Financial roles can update status"
ON public.bank_reconciliations
FOR UPDATE
TO authenticated
USING (
  -- Can update own pending records
  (auth.uid() = created_by AND status = 'pending')
  OR
  -- Or has financial role to update any status
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'financeiro_master'::app_role) OR
    public.has_role(auth.uid(), 'gestor_master'::app_role)
  )
)
WITH CHECK (
  -- Regular users can only update their own pending records and not change status
  (
    auth.uid() = created_by 
    AND status = 'pending'
    AND (SELECT status FROM public.bank_reconciliations WHERE id = bank_reconciliations.id) = 'pending'
  )
  OR
  -- Financial roles can update any status
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'financeiro_master'::app_role) OR
    public.has_role(auth.uid(), 'gestor_master'::app_role)
  )
);

-- Policy: Only admins can delete reconciliations
CREATE POLICY "Admins can delete reconciliations"
ON public.bank_reconciliations
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'gestor_master'::app_role)
);

-- Create index for better performance
CREATE INDEX idx_bank_reconciliations_reference ON public.bank_reconciliations(reference_type, reference_id);
CREATE INDEX idx_bank_reconciliations_status ON public.bank_reconciliations(status);
CREATE INDEX idx_bank_reconciliations_date ON public.bank_reconciliations(transaction_date);