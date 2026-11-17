CREATE TABLE public.contas_receber (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 cadastro_id uuid REFERENCES public.cadastros(id) ON DELETE SET NULL,
 venda_id uuid REFERENCES public.vendas(id) ON DELETE SET NULL,
 empresa_id uuid REFERENCES public.empresas(id),
 descricao text NOT NULL,
 vencimento date NOT NULL,
 valor numeric NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto','Recebido','Cancelado')),
 recebido_em date,
 observacao text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.contratos_aluguel (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contrato text, proprietario text NOT NULL, midias text, periodicidade text,
 vigencia date, vencimento date, valor numeric NOT NULL DEFAULT 0,
 ativo boolean NOT NULL DEFAULT true, validado boolean NOT NULL DEFAULT false, observacao text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.contratos_energia (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 num_cliente text, num_instalacao text, unidade text, data_inicio date, titular text, local text,
 ativo boolean NOT NULL DEFAULT true, observacao text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.contas_receber (vencimento);
CREATE INDEX ON public.contas_receber (status);
CREATE INDEX ON public.contratos_aluguel (vencimento);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_receber, public.contratos_aluguel, public.contratos_energia TO authenticated;
GRANT ALL ON public.contas_receber, public.contratos_aluguel, public.contratos_energia TO service_role;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_aluguel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_energia ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['contas_receber','contratos_aluguel','contratos_energia'] LOOP
 EXECUTE format('CREATE POLICY %1$s_select ON public.%1$s FOR SELECT TO authenticated USING (public.is_membro(auth.uid()))', t);
 EXECUTE format('CREATE POLICY %1$s_insert ON public.%1$s FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()))', t);
 EXECUTE format('CREATE POLICY %1$s_update ON public.%1$s FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()))', t);
 EXECUTE format('CREATE POLICY %1$s_delete ON public.%1$s FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t);
 EXECUTE format('CREATE TRIGGER %1$s_touch BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t);
END LOOP; END $$;