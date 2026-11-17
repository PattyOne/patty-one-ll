CREATE OR REPLACE FUNCTION public.importar_historico_comercial_sige(linhas jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; cid uuid; eid uuid; nc integer; ne integer; inseridos integer:=0; atualizados integer:=0; chave text;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
 IF jsonb_typeof(linhas) <> 'array' OR jsonb_array_length(linhas)>500 THEN RAISE EXCEPTION 'Envie até 500 registros'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(linhas) LOOP
  chave:=r->>'chave_sige';
  IF chave IS NULL OR chave <> (CASE WHEN r->>'tipo'='proposta' THEN 'proposta:' ELSE 'autorizacao:' END || (r->>'numero_sige')) THEN RAISE EXCEPTION 'Identificação SIGE inválida'; END IF;
  SELECT count(*), (array_agg(id))[1] INTO nc,cid FROM public.cadastros WHERE upper(trim(nome))=upper(trim(r->>'cliente_nome'));
  IF nc<>1 THEN cid:=NULL; END IF;
  SELECT count(*), (array_agg(id))[1] INTO ne,eid FROM public.empresas WHERE upper(trim(nome))=upper(trim(CASE r->>'empresa_nome' WHEN 'PATTY PAINEIS LTDA' THEN 'Patty Painéis' WHEN 'PATTY COMERCIAL' THEN 'Patty Comercial' ELSE r->>'empresa_nome' END));
  IF ne<>1 THEN eid:=NULL; END IF;
  IF EXISTS(SELECT 1 FROM public.historico_comercial_sige WHERE chave_sige=chave) THEN atualizados:=atualizados+1; ELSE inseridos:=inseridos+1; END IF;
  INSERT INTO public.historico_comercial_sige(chave_sige,tipo,numero_sige,autorizacao_sige,contrato_sige,proposta_numero_sige,cliente_nome,cadastro_id,empresa_nome,empresa_id,empresa_origem,data_documento,valor,valor_liquido,vendedor,status_sige,tipo_servico,fontes,dados_sige)
  VALUES(chave,r->>'tipo',r->>'numero_sige',r->>'autorizacao_sige',r->>'contrato_sige',r->>'proposta_numero_sige',r->>'cliente_nome',cid,r->>'empresa_nome',eid,r->>'empresa_origem',(r->>'data_documento')::date,(r->>'valor')::numeric,(r->>'valor_liquido')::numeric,r->>'vendedor',r->>'status_sige',r->>'tipo_servico',r->'fontes',r->'dados_sige')
  ON CONFLICT(chave_sige) DO UPDATE SET tipo=excluded.tipo,numero_sige=excluded.numero_sige,autorizacao_sige=excluded.autorizacao_sige,contrato_sige=excluded.contrato_sige,proposta_numero_sige=excluded.proposta_numero_sige,cliente_nome=excluded.cliente_nome,cadastro_id=excluded.cadastro_id,empresa_nome=excluded.empresa_nome,empresa_id=excluded.empresa_id,empresa_origem=excluded.empresa_origem,data_documento=excluded.data_documento,valor=excluded.valor,valor_liquido=excluded.valor_liquido,vendedor=excluded.vendedor,status_sige=excluded.status_sige,tipo_servico=excluded.tipo_servico,fontes=excluded.fontes,dados_sige=excluded.dados_sige,importado_em=now();
 END LOOP;
 RETURN jsonb_build_object('inseridos',inseridos,'atualizados',atualizados);
END $$;
REVOKE ALL ON FUNCTION public.importar_historico_comercial_sige(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.importar_historico_comercial_sige(jsonb) TO authenticated;
