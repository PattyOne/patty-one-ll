CREATE TABLE public.historico_comercial_sige (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 chave_sige text NOT NULL UNIQUE,
 tipo text NOT NULL CHECK (tipo IN ('proposta','contrato','reserva')),
 numero_sige text NOT NULL,
 autorizacao_sige text,
 contrato_sige text,
 proposta_numero_sige text,
 cliente_nome text NOT NULL,
 cadastro_id uuid REFERENCES public.cadastros(id),
 empresa_nome text,
 empresa_id uuid REFERENCES public.empresas(id),
 empresa_origem text CHECK (empresa_origem IN ('arquivo','proposta')),
 data_documento date NOT NULL,
 valor numeric NOT NULL CHECK (valor >= 0),
 valor_liquido numeric CHECK (valor_liquido >= 0),
 vendedor text,
 status_sige text NOT NULL,
 tipo_servico text,
 fontes jsonb NOT NULL DEFAULT '[]'::jsonb,
 dados_sige jsonb NOT NULL,
 importado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.historico_comercial_sige TO authenticated;
GRANT ALL ON public.historico_comercial_sige TO service_role;
ALTER TABLE public.historico_comercial_sige ENABLE ROW LEVEL SECURITY;
CREATE POLICY historico_comercial_select ON public.historico_comercial_sige FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE INDEX historico_comercial_data_idx ON public.historico_comercial_sige(data_documento DESC, numero_sige);
CREATE INDEX historico_comercial_cliente_idx ON public.historico_comercial_sige(cadastro_id);
CREATE INDEX historico_comercial_tipo_idx ON public.historico_comercial_sige(tipo);
COMMENT ON TABLE public.historico_comercial_sige IS 'Read-only SIGE commercial archive. No invented line items, company assignments or occupancy periods; unique keys merge contracts/reservations by authorization.';