CREATE TABLE public.pontos_ocupacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ponto_id uuid NOT NULL REFERENCES public.pontos_midia(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  bissemana integer NOT NULL CHECK (bissemana BETWEEN 1 AND 27),
  status text NOT NULL CHECK (status IN ('Reservado','Ocupado')),
  cliente text,
  observacao text,
  updated_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ponto_id, ano, bissemana)
);
CREATE INDEX pontos_ocupacao_ano_idx ON public.pontos_ocupacao(ano, bissemana);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pontos_ocupacao TO authenticated;
GRANT ALL ON public.pontos_ocupacao TO service_role;
ALTER TABLE public.pontos_ocupacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY ocupacao_select ON public.pontos_ocupacao FOR SELECT TO authenticated USING (true);
CREATE POLICY ocupacao_insert ON public.pontos_ocupacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ocupacao_update ON public.pontos_ocupacao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY ocupacao_delete ON public.pontos_ocupacao FOR DELETE TO authenticated USING (true);
CREATE TRIGGER pontos_ocupacao_touch BEFORE UPDATE ON public.pontos_ocupacao FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();