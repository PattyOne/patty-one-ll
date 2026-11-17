CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cnpj text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY empresas_select ON public.empresas FOR SELECT TO authenticated USING (true);
INSERT INTO public.empresas (nome) VALUES
 ('GV Serviços de Colagem e Manutenção de Painéis'), ('Patty Painéis'), ('Patty Comercial'), ('Vilana');

CREATE SEQUENCE public.vendas_numero_proposta_seq;
CREATE SEQUENCE public.vendas_numero_pedido_seq;
GRANT USAGE ON SEQUENCE public.vendas_numero_proposta_seq, public.vendas_numero_pedido_seq TO authenticated;

CREATE TABLE public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('proposta','pedido')),
  numero integer,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  cadastro_id uuid NOT NULL REFERENCES public.cadastros(id),
  vendedor text,
  status text NOT NULL,
  validade date,
  condicoes_pagamento text,
  observacao text,
  desconto numeric NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  proposta_id uuid REFERENCES public.vendas(id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vendas_status_valido CHECK (
    (tipo = 'proposta' AND status IN ('Rascunho','Enviada','Aprovada','Recusada')) OR
    (tipo = 'pedido' AND status IN ('Aberto','Em andamento','Concluído','Cancelado')))
);
CREATE UNIQUE INDEX vendas_tipo_numero_uniq ON public.vendas (tipo, numero);
CREATE UNIQUE INDEX vendas_proposta_uniq ON public.vendas (proposta_id) WHERE proposta_id IS NOT NULL;
CREATE INDEX vendas_cadastro_idx ON public.vendas (cadastro_id);
CREATE INDEX vendas_tipo_status_idx ON public.vendas (tipo, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO authenticated;
GRANT ALL ON public.vendas TO service_role;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendas_select ON public.vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY vendas_insert ON public.vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendas_update ON public.vendas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY vendas_delete ON public.vendas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.vendas_numerar() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := CASE WHEN NEW.tipo = 'proposta' THEN nextval('public.vendas_numero_proposta_seq') ELSE nextval('public.vendas_numero_pedido_seq') END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER vendas_numerar BEFORE INSERT ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.vendas_numerar();
CREATE TRIGGER vendas_touch BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.vendas_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  categoria text NOT NULL CHECK (categoria IN ('Mídia OOH','Produção','Serviço','Item livre')),
  descricao text NOT NULL,
  ponto text,
  periodo_inicio date,
  periodo_fim date,
  quantidade numeric NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_unitario numeric NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0),
  desconto numeric NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  CONSTRAINT vendas_itens_periodo CHECK (periodo_fim IS NULL OR periodo_inicio IS NULL OR periodo_fim >= periodo_inicio)
);
CREATE INDEX vendas_itens_venda_idx ON public.vendas_itens (venda_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas_itens TO authenticated;
GRANT ALL ON public.vendas_itens TO service_role;
ALTER TABLE public.vendas_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendas_itens_select ON public.vendas_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY vendas_itens_insert ON public.vendas_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendas_itens_update ON public.vendas_itens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY vendas_itens_delete ON public.vendas_itens FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.salvar_venda(dados jsonb, venda_uuid uuid DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_id uuid; item jsonb; i integer := 0;
BEGIN
  IF jsonb_array_length(coalesce(dados->'itens','[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'Inclua pelo menos um item'; END IF;
  IF venda_uuid IS NULL THEN
    INSERT INTO vendas (tipo, empresa_id, cadastro_id, vendedor, status, validade, condicoes_pagamento, observacao, desconto)
    VALUES (dados->>'tipo', (dados->>'empresa_id')::uuid, (dados->>'cadastro_id')::uuid, nullif(dados->>'vendedor',''),
      dados->>'status', nullif(dados->>'validade','')::date, nullif(dados->>'condicoes_pagamento',''), nullif(dados->>'observacao',''),
      coalesce((dados->>'desconto')::numeric,0))
    RETURNING id INTO v_id;
  ELSE
    UPDATE vendas SET empresa_id = (dados->>'empresa_id')::uuid, cadastro_id = (dados->>'cadastro_id')::uuid,
      vendedor = nullif(dados->>'vendedor',''), status = dados->>'status', validade = nullif(dados->>'validade','')::date,
      condicoes_pagamento = nullif(dados->>'condicoes_pagamento',''), observacao = nullif(dados->>'observacao',''),
      desconto = coalesce((dados->>'desconto')::numeric,0)
    WHERE id = venda_uuid RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Documento não encontrado'; END IF;
    DELETE FROM vendas_itens WHERE venda_id = v_id;
  END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(dados->'itens') LOOP
    i := i + 1;
    IF coalesce(trim(item->>'descricao'),'') = '' THEN RAISE EXCEPTION 'Item % sem descrição', i; END IF;
    INSERT INTO vendas_itens (venda_id, ordem, categoria, descricao, ponto, periodo_inicio, periodo_fim, quantidade, valor_unitario, desconto)
    VALUES (v_id, i, item->>'categoria', trim(item->>'descricao'), nullif(item->>'ponto',''),
      nullif(item->>'periodo_inicio','')::date, nullif(item->>'periodo_fim','')::date,
      coalesce((item->>'quantidade')::numeric,1), coalesce((item->>'valor_unitario')::numeric,0), coalesce((item->>'desconto')::numeric,0));
  END LOOP;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.converter_proposta(proposta_uuid uuid) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p vendas; novo uuid;
BEGIN
  SELECT * INTO p FROM vendas WHERE id = proposta_uuid AND tipo = 'proposta';
  IF p.id IS NULL THEN RAISE EXCEPTION 'Proposta não encontrada'; END IF;
  IF p.status = 'Recusada' THEN RAISE EXCEPTION 'Proposta recusada não pode virar pedido'; END IF;
  IF EXISTS (SELECT 1 FROM vendas WHERE proposta_id = p.id) THEN RAISE EXCEPTION 'Esta proposta já gerou um pedido'; END IF;
  INSERT INTO vendas (tipo, empresa_id, cadastro_id, vendedor, status, condicoes_pagamento, observacao, desconto, proposta_id)
  VALUES ('pedido', p.empresa_id, p.cadastro_id, p.vendedor, 'Aberto', p.condicoes_pagamento, p.observacao, p.desconto, p.id)
  RETURNING id INTO novo;
  INSERT INTO vendas_itens (venda_id, ordem, categoria, descricao, ponto, periodo_inicio, periodo_fim, quantidade, valor_unitario, desconto)
  SELECT novo, ordem, categoria, descricao, ponto, periodo_inicio, periodo_fim, quantidade, valor_unitario, desconto FROM vendas_itens WHERE venda_id = p.id;
  UPDATE vendas SET status = 'Aprovada' WHERE id = p.id;
  RETURN novo;
END $$;
GRANT EXECUTE ON FUNCTION public.salvar_venda(jsonb, uuid), public.converter_proposta(uuid) TO authenticated;