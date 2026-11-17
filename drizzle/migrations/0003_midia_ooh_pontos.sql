CREATE TABLE public.tipos_midia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_midia TO authenticated;
GRANT ALL ON public.tipos_midia TO service_role;
ALTER TABLE public.tipos_midia ENABLE ROW LEVEL SECURITY;
CREATE POLICY tipos_select ON public.tipos_midia FOR SELECT TO authenticated USING (true);
CREATE POLICY tipos_admin ON public.tipos_midia FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.pontos_midia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  nome text NOT NULL,
  tipo_id uuid NOT NULL REFERENCES public.tipos_midia(id),
  endereco text, bairro text, cidade text, estado char(2), referencia text,
  latitude numeric(9,6), longitude numeric(9,6),
  faces integer NOT NULL DEFAULT 1,
  iluminado boolean NOT NULL DEFAULT false,
  largura numeric, altura numeric,
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Inativo','Em manutenção')),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CHECK (faces >= 1)
);
CREATE INDEX pontos_midia_tipo_idx ON public.pontos_midia(tipo_id);
CREATE INDEX pontos_midia_cidade_idx ON public.pontos_midia(cidade);
CREATE TRIGGER pontos_midia_touch BEFORE UPDATE ON public.pontos_midia FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pontos_midia TO authenticated;
GRANT ALL ON public.pontos_midia TO service_role;
ALTER TABLE public.pontos_midia ENABLE ROW LEVEL SECURITY;
CREATE POLICY pontos_select ON public.pontos_midia FOR SELECT TO authenticated USING (true);
CREATE POLICY pontos_insert ON public.pontos_midia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY pontos_update ON public.pontos_midia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY pontos_delete ON public.pontos_midia FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.pontos_midia_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ponto_id uuid NOT NULL REFERENCES public.pontos_midia(id) ON DELETE CASCADE,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pontos_fotos_ponto_idx ON public.pontos_midia_fotos(ponto_id);
GRANT SELECT, INSERT, DELETE ON public.pontos_midia_fotos TO authenticated;
GRANT ALL ON public.pontos_midia_fotos TO service_role;
ALTER TABLE public.pontos_midia_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY fotos_select ON public.pontos_midia_fotos FOR SELECT TO authenticated USING (true);
CREATE POLICY fotos_insert ON public.pontos_midia_fotos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fotos_delete ON public.pontos_midia_fotos FOR DELETE TO authenticated USING (true);

CREATE POLICY pontos_storage_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pontos-midia');
CREATE POLICY pontos_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pontos-midia');
CREATE POLICY pontos_storage_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pontos-midia');