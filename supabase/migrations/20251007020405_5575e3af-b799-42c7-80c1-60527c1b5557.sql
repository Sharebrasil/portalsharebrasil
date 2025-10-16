-- Add missing fields to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS financial_contact TEXT;

-- Update the table comment
COMMENT ON TABLE public.clients IS 'Stores client/shareholder company information including contact details and documentation';