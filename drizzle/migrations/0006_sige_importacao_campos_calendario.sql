ALTER TABLE public.cadastros ADD COLUMN IF NOT EXISTS restricao_sige boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS restricao_observacao text, ADD COLUMN IF NOT EXISTS dados_sige jsonb;
ALTER TABLE public.pontos_midia ADD COLUMN IF NOT EXISTS id_sige text, ADD COLUMN IF NOT EXISTS codigo_sige text, ADD COLUMN IF NOT EXISTS dados_sige jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS pontos_midia_id_sige_unique ON public.pontos_midia(id_sige) WHERE id_sige IS NOT NULL;
CREATE TABLE public.calendario_bissemanas (ano integer NOT NULL, numero integer NOT NULL CHECK(numero BETWEEN 1 AND 27), codigo_sige integer NOT NULL, inicio date NOT NULL UNIQUE, fim date NOT NULL, PRIMARY KEY(ano,numero), UNIQUE(ano,codigo_sige), CHECK(fim=inicio+13));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendario_bissemanas TO authenticated;
GRANT ALL ON public.calendario_bissemanas TO service_role;
ALTER TABLE public.calendario_bissemanas ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendario_select ON public.calendario_bissemanas FOR SELECT TO authenticated USING(public.is_membro(auth.uid()));
CREATE POLICY calendario_admin ON public.calendario_bissemanas FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.listar_cadastros(filtros jsonb DEFAULT '{}'::jsonb, pagina integer DEFAULT 1) RETURNS jsonb LANGUAGE plpgsql SET search_path TO public AS $$ DECLARE total bigint; linhas jsonb; vendedores jsonb; estados jsonb; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
SELECT count(*) INTO total FROM public.cadastros c WHERE public.cadastro_corresponde(c,filtros);
SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') INTO linhas FROM(SELECT id,nome,cpf_cnpj,cidade,estado,vendedor,is_cliente,is_fornecedor,is_prestador,restricao_sige,restricao_observacao,coalesce(celular,telefone,telefone2,celular2) AS telefone FROM public.cadastros c WHERE public.cadastro_corresponde(c,filtros) ORDER BY nome,id LIMIT 50 OFFSET(greatest(pagina,1)-1)*50)t;
SELECT coalesce(jsonb_agg(vendedor ORDER BY vendedor),'[]') INTO vendedores FROM(SELECT DISTINCT vendedor FROM public.cadastros WHERE nullif(trim(vendedor),'') IS NOT NULL)t;
SELECT coalesce(jsonb_agg(estado ORDER BY estado),'[]') INTO estados FROM(SELECT DISTINCT estado FROM public.cadastros WHERE estado IS NOT NULL)t;
RETURN jsonb_build_object('total',total,'linhas',linhas,'vendedores',vendedores,'estados',estados); END; $$;