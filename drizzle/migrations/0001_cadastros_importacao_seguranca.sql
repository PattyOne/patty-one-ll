CREATE TABLE public.cadastros (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), id_sige text, tipo_pessoa text CHECK(tipo_pessoa IN ('Pessoa Jurídica','Pessoa Física')), nome text NOT NULL, razao_social text, cpf_cnpj text, cpf_cnpj_digitos text, ie text, im text, is_cliente boolean DEFAULT false, is_fornecedor boolean DEFAULT false, is_prestador boolean DEFAULT false, vendedor text, origem text, contato text, celular text, celular2 text, telefone text, telefone2 text, email text, email2 text, contato_financeiro text, telefone_financeiro text, email_financeiro text, cep text, endereco text, numero text, complemento text, bairro text, cidade text, estado char(2), codigo_municipio text, reter_iss boolean DEFAULT false, percentual_iss numeric, tipo_comissao text DEFAULT 'Nenhuma' CHECK(tipo_comissao IN ('Nenhuma','Comissão como Agência','Comissão como Representante','Comissão de aluguel')), percentual_comissao numeric, percentual_servicos numeric, observacao text, validado text DEFAULT 'Não' CHECK(validado IN ('Sim','Não')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.cadastros TO authenticated;
GRANT ALL ON public.cadastros TO service_role;
ALTER TABLE public.cadastros ENABLE ROW LEVEL SECURITY;
CREATE POLICY cadastros_select ON public.cadastros FOR SELECT TO authenticated USING(true);
CREATE POLICY cadastros_insert ON public.cadastros FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY cadastros_update ON public.cadastros FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY cadastros_delete ON public.cadastros FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.cadastros_bancario(cadastro_id uuid PRIMARY KEY REFERENCES public.cadastros(id) ON DELETE CASCADE,titular text,banco text,cod_banco text,agencia text,conta text);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.cadastros_bancario TO authenticated;
GRANT ALL ON public.cadastros_bancario TO service_role;
ALTER TABLE public.cadastros_bancario ENABLE ROW LEVEL SECURITY;
CREATE POLICY bancario_admin ON public.cadastros_bancario FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.normalizar_cadastro() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
NEW.nome:=nullif(trim(NEW.nome),''); IF NEW.nome IS NULL THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
NEW.id_sige:=nullif(trim(NEW.id_sige),''); NEW.cpf_cnpj_digitos:=nullif(regexp_replace(coalesce(NEW.cpf_cnpj,''),'[^0-9]','','g'),''); NEW.estado:=nullif(upper(trim(NEW.estado)),''); NEW.updated_at:=now(); RETURN NEW; END; $$;
CREATE TRIGGER normalizar_cadastro BEFORE INSERT OR UPDATE ON public.cadastros FOR EACH ROW EXECUTE FUNCTION public.normalizar_cadastro();
CREATE UNIQUE INDEX cadastros_documento_unique ON public.cadastros(cpf_cnpj_digitos) WHERE cpf_cnpj_digitos IS NOT NULL AND cpf_cnpj_digitos<>'';
CREATE UNIQUE INDEX cadastros_sige_unique ON public.cadastros(id_sige) WHERE id_sige IS NOT NULL AND id_sige<>'';
CREATE INDEX cadastros_nome_idx ON public.cadastros(nome);
CREATE INDEX cadastros_cidade_idx ON public.cadastros(cidade);
CREATE INDEX cadastros_estado_idx ON public.cadastros(estado);
CREATE INDEX cadastros_vendedor_idx ON public.cadastros(vendedor);
CREATE INDEX cadastros_email_idx ON public.cadastros(email);
CREATE OR REPLACE FUNCTION public.salvar_cadastro(dados jsonb,cadastro_uuid uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE r public.cadastros; destino uuid; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
IF cadastro_uuid IS NOT NULL THEN SELECT * INTO r FROM public.cadastros WHERE id=cadastro_uuid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro não encontrado'; END IF;
ELSE r.id:=gen_random_uuid(); r.is_cliente:=false; r.is_fornecedor:=false; r.is_prestador:=false; r.reter_iss:=false; r.tipo_comissao:='Nenhuma'; r.validado:='Não'; END IF;
r:=jsonb_populate_record(r,dados-'id'-'created_at'-'updated_at'-'cpf_cnpj_digitos');
INSERT INTO public.cadastros(id,id_sige,tipo_pessoa,nome,razao_social,cpf_cnpj,ie,im,is_cliente,is_fornecedor,is_prestador,vendedor,origem,contato,celular,celular2,telefone,telefone2,email,email2,contato_financeiro,telefone_financeiro,email_financeiro,cep,endereco,numero,complemento,bairro,cidade,estado,codigo_municipio,reter_iss,percentual_iss,tipo_comissao,percentual_comissao,percentual_servicos,observacao,validado)
VALUES(r.id,r.id_sige,r.tipo_pessoa,r.nome,r.razao_social,r.cpf_cnpj,r.ie,r.im,r.is_cliente,r.is_fornecedor,r.is_prestador,r.vendedor,r.origem,r.contato,r.celular,r.celular2,r.telefone,r.telefone2,r.email,r.email2,r.contato_financeiro,r.telefone_financeiro,r.email_financeiro,r.cep,r.endereco,r.numero,r.complemento,r.bairro,r.cidade,r.estado,r.codigo_municipio,r.reter_iss,r.percentual_iss,r.tipo_comissao,r.percentual_comissao,r.percentual_servicos,r.observacao,r.validado)
ON CONFLICT(id) DO UPDATE SET id_sige=EXCLUDED.id_sige,tipo_pessoa=EXCLUDED.tipo_pessoa,nome=EXCLUDED.nome,razao_social=EXCLUDED.razao_social,cpf_cnpj=EXCLUDED.cpf_cnpj,ie=EXCLUDED.ie,im=EXCLUDED.im,is_cliente=EXCLUDED.is_cliente,is_fornecedor=EXCLUDED.is_fornecedor,is_prestador=EXCLUDED.is_prestador,vendedor=EXCLUDED.vendedor,origem=EXCLUDED.origem,contato=EXCLUDED.contato,celular=EXCLUDED.celular,celular2=EXCLUDED.celular2,telefone=EXCLUDED.telefone,telefone2=EXCLUDED.telefone2,email=EXCLUDED.email,email2=EXCLUDED.email2,contato_financeiro=EXCLUDED.contato_financeiro,telefone_financeiro=EXCLUDED.telefone_financeiro,email_financeiro=EXCLUDED.email_financeiro,cep=EXCLUDED.cep,endereco=EXCLUDED.endereco,numero=EXCLUDED.numero,complemento=EXCLUDED.complemento,bairro=EXCLUDED.bairro,cidade=EXCLUDED.cidade,estado=EXCLUDED.estado,codigo_municipio=EXCLUDED.codigo_municipio,reter_iss=EXCLUDED.reter_iss,percentual_iss=EXCLUDED.percentual_iss,tipo_comissao=EXCLUDED.tipo_comissao,percentual_comissao=EXCLUDED.percentual_comissao,percentual_servicos=EXCLUDED.percentual_servicos,observacao=EXCLUDED.observacao,validado=EXCLUDED.validado RETURNING id INTO destino;
IF dados ?| ARRAY['titular','banco','cod_banco','agencia','conta'] THEN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito aos dados bancários'; END IF;
INSERT INTO public.cadastros_bancario(cadastro_id,titular,banco,cod_banco,agencia,conta) VALUES(destino,dados->>'titular',dados->>'banco',dados->>'cod_banco',dados->>'agencia',dados->>'conta') ON CONFLICT(cadastro_id) DO UPDATE SET titular=EXCLUDED.titular,banco=EXCLUDED.banco,cod_banco=EXCLUDED.cod_banco,agencia=EXCLUDED.agencia,conta=EXCLUDED.conta; END IF; RETURN destino; END; $$;
REVOKE ALL ON FUNCTION public.salvar_cadastro(jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_cadastro(jsonb,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.importar_cadastros(linhas jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE linha jsonb; destino uuid; digitos text; resultado jsonb:='[]'; status text; motivo text; BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
IF jsonb_typeof(linhas)<>'array' OR jsonb_array_length(linhas)>500 THEN RAISE EXCEPTION 'Limite de 500 linhas por lote'; END IF;
FOR linha IN SELECT value FROM jsonb_array_elements(linhas) LOOP BEGIN
IF nullif(trim(linha->>'nome'),'') IS NULL THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
destino:=NULL; digitos:=nullif(regexp_replace(coalesce(linha->>'cpf_cnpj',''),'[^0-9]','','g'),'');
IF digitos IS NULL AND nullif(trim(linha->>'id_sige'),'') IS NULL THEN RAISE EXCEPTION 'Informe CPF/CNPJ ou ID SIGE para evitar duplicações'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(digitos,nullif(trim(linha->>'id_sige'),'')),0));
IF digitos IS NOT NULL THEN SELECT id INTO destino FROM public.cadastros WHERE cpf_cnpj_digitos=digitos; ELSE SELECT id INTO destino FROM public.cadastros WHERE id_sige=nullif(trim(linha->>'id_sige'),''); END IF;
status:=CASE WHEN destino IS NULL THEN 'inserido' ELSE 'atualizado' END;
destino:=public.salvar_cadastro(linha,destino);
resultado:=resultado||jsonb_build_array(jsonb_build_object('linha',linha->'linha','nome',linha->>'nome','cpf_cnpj',linha->>'cpf_cnpj','resultado',status,'id',destino,'motivo',null));
EXCEPTION WHEN OTHERS THEN motivo:=CASE WHEN SQLSTATE='23505' THEN 'CPF/CNPJ ou ID SIGE já cadastrado em outro registro' ELSE SQLERRM END; resultado:=resultado||jsonb_build_array(jsonb_build_object('linha',linha->'linha','nome',linha->>'nome','cpf_cnpj',linha->>'cpf_cnpj','resultado','erro','motivo',motivo)); END; END LOOP; RETURN resultado; END; $$;
REVOKE ALL ON FUNCTION public.importar_cadastros(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.importar_cadastros(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.cadastro_corresponde(c public.cadastros,filtros jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT
(coalesce(filtros->>'busca','')='' OR c.nome ILIKE '%'||(filtros->>'busca')||'%' OR c.razao_social ILIKE '%'||(filtros->>'busca')||'%' OR c.cpf_cnpj ILIKE '%'||(filtros->>'busca')||'%' OR (regexp_replace(filtros->>'busca','[^0-9]','','g')<>'' AND c.cpf_cnpj_digitos LIKE '%'||regexp_replace(filtros->>'busca','[^0-9]','','g')||'%') OR c.cidade ILIKE '%'||(filtros->>'busca')||'%' OR c.email ILIKE '%'||(filtros->>'busca')||'%' OR c.email2 ILIKE '%'||(filtros->>'busca')||'%')
AND(coalesce(filtros->>'vendedor','')='' OR c.vendedor=filtros->>'vendedor') AND(coalesce(filtros->>'estado','')='' OR c.estado=filtros->>'estado') AND(coalesce((filtros->>'sem_vendedor')::boolean,false)=false OR nullif(trim(c.vendedor),'') IS NULL) AND(coalesce(filtros->>'tipo','')='' OR(filtros->>'tipo'='cliente' AND c.is_cliente) OR(filtros->>'tipo'='fornecedor' AND c.is_fornecedor) OR(filtros->>'tipo'='prestador' AND c.is_prestador)); $$;
CREATE OR REPLACE FUNCTION public.listar_cadastros(filtros jsonb DEFAULT '{}',pagina integer DEFAULT 1) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE total bigint; linhas jsonb; vendedores jsonb; estados jsonb; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
SELECT count(*) INTO total FROM public.cadastros c WHERE public.cadastro_corresponde(c,filtros);
SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') INTO linhas FROM(SELECT id,nome,cpf_cnpj,cidade,estado,vendedor,is_cliente,is_fornecedor,is_prestador,coalesce(celular,telefone,telefone2,celular2) AS telefone FROM public.cadastros c WHERE public.cadastro_corresponde(c,filtros) ORDER BY nome,id LIMIT 50 OFFSET(greatest(pagina,1)-1)*50)t;
SELECT coalesce(jsonb_agg(vendedor ORDER BY vendedor),'[]') INTO vendedores FROM(SELECT DISTINCT vendedor FROM public.cadastros WHERE nullif(trim(vendedor),'') IS NOT NULL)t;
SELECT coalesce(jsonb_agg(estado ORDER BY estado),'[]') INTO estados FROM(SELECT DISTINCT estado FROM public.cadastros WHERE estado IS NOT NULL)t;
RETURN jsonb_build_object('total',total,'linhas',linhas,'vendedores',vendedores,'estados',estados); END; $$;
CREATE OR REPLACE FUNCTION public.atribuir_vendedor(vendedor_novo text,ids uuid[] DEFAULT NULL,filtros jsonb DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE quantidade integer; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
IF nullif(trim(vendedor_novo),'') IS NULL THEN RAISE EXCEPTION 'Vendedor obrigatório'; END IF;
IF ids IS NULL AND filtros IS NULL THEN RAISE EXCEPTION 'Seleção obrigatória'; END IF;
UPDATE public.cadastros c SET vendedor=trim(vendedor_novo) WHERE(ids IS NOT NULL AND c.id=ANY(ids)) OR(ids IS NULL AND filtros IS NOT NULL AND public.cadastro_corresponde(c,filtros)); GET DIAGNOSTICS quantidade=ROW_COUNT; RETURN quantidade; END; $$;
REVOKE ALL ON FUNCTION public.cadastro_corresponde(public.cadastros,jsonb),public.listar_cadastros(jsonb,integer),public.atribuir_vendedor(text,uuid[],jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cadastro_corresponde(public.cadastros,jsonb),public.listar_cadastros(jsonb,integer),public.atribuir_vendedor(text,uuid[],jsonb) TO authenticated;