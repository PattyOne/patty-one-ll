CREATE TABLE public.programacao_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  data_original date NOT NULL,
  setor text NOT NULL CHECK (setor IN ('Externa','Projetos especiais','Serralheria','Acabamento e montagem','Produção','Corte','Pintura')),
  cadastro_id uuid REFERENCES public.cadastros(id) ON DELETE SET NULL,
  cliente text,
  produto text,
  servico text NOT NULL,
  detalhamento text,
  ponto_id uuid REFERENCES public.pontos_midia(id) ON DELETE SET NULL,
  local text,
  quantidade numeric NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  equipe_id uuid REFERENCES public.producao_equipes(id) ON DELETE SET NULL,
  lider_id uuid REFERENCES public.producao_colaboradores(id) ON DELETE SET NULL,
  veiculo_id uuid REFERENCES public.producao_veiculos(id) ON DELETE SET NULL,
  ordem_id uuid REFERENCES public.ordens_producao(id) ON DELETE SET NULL,
  hora_inicio time,
  hora_fim time,
  status text NOT NULL DEFAULT 'Programado' CHECK (status IN ('Programado','Em andamento','Concluído','Não realizado','Aguardando equipe')),
  observacao text,
  posicao integer NOT NULL DEFAULT 0,
  reagendamentos integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((hora_inicio IS NULL) = (hora_fim IS NULL) AND (hora_fim IS NULL OR hora_fim > hora_inicio))
);
CREATE INDEX programacao_servicos_data_idx ON public.programacao_servicos (data, setor, posicao);
CREATE INDEX programacao_servicos_status_idx ON public.programacao_servicos (status) WHERE status IN ('Não realizado','Aguardando equipe');
CREATE TABLE public.programacao_servicos_ajudantes (
  servico_id uuid NOT NULL REFERENCES public.programacao_servicos(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES public.producao_colaboradores(id) ON DELETE CASCADE,
  PRIMARY KEY (servico_id, colaborador_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programacao_servicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programacao_servicos_ajudantes TO authenticated;
GRANT ALL ON public.programacao_servicos, public.programacao_servicos_ajudantes TO service_role;
ALTER TABLE public.programacao_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programacao_servicos_ajudantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY prog_select ON public.programacao_servicos FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY prog_insert ON public.programacao_servicos FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY prog_update ON public.programacao_servicos FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY prog_delete ON public.programacao_servicos FOR DELETE TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY prog_aj_select ON public.programacao_servicos_ajudantes FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY prog_aj_insert ON public.programacao_servicos_ajudantes FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY prog_aj_delete ON public.programacao_servicos_ajudantes FOR DELETE TO authenticated USING (public.is_membro(auth.uid()));
CREATE TRIGGER programacao_servicos_touch BEFORE UPDATE ON public.programacao_servicos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.salvar_programacao_lote(linhas jsonb, excluir uuid[] DEFAULT '{}')
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
declare
  l jsonb; v_id uuid; v_data date; v_n integer := 0; v_pos integer := 0;
begin
  if not public.is_membro(auth.uid()) then raise exception 'Acesso restrito aos membros da equipe'; end if;
  if coalesce(array_length(excluir,1),0) > 0 then
    delete from public.programacao_servicos where id = any(excluir);
  end if;
  for l in select * from jsonb_array_elements(coalesce(linhas,'[]'::jsonb)) loop
    v_pos := v_pos + 1;
    if nullif(l->>'data','') is null then raise exception 'Linha %: informe a data', v_pos; end if;
    if btrim(coalesce(l->>'servico','')) = '' then raise exception 'Linha %: informe o serviço', v_pos; end if;
    v_data := (l->>'data')::date;
    v_id := nullif(l->>'id','')::uuid;
    if v_id is null then
      insert into public.programacao_servicos (data, data_original, setor, cadastro_id, cliente, produto, servico, detalhamento, ponto_id, local, quantidade, equipe_id, lider_id, veiculo_id, ordem_id, hora_inicio, hora_fim, status, observacao, posicao, created_by)
      values (v_data, v_data, l->>'setor', nullif(l->>'cadastro_id','')::uuid, nullif(btrim(l->>'cliente'),''), nullif(btrim(l->>'produto'),''), btrim(l->>'servico'), nullif(btrim(l->>'detalhamento'),''), nullif(l->>'ponto_id','')::uuid, nullif(btrim(l->>'local'),''), coalesce(nullif(l->>'quantidade','')::numeric,1), nullif(l->>'equipe_id','')::uuid, nullif(l->>'lider_id','')::uuid, nullif(l->>'veiculo_id','')::uuid, nullif(l->>'ordem_id','')::uuid, nullif(l->>'hora_inicio','')::time, nullif(l->>'hora_fim','')::time, coalesce(nullif(l->>'status',''),'Programado'), nullif(btrim(l->>'observacao'),''), coalesce(nullif(l->>'posicao','')::int, v_pos), auth.uid())
      returning id into v_id;
    else
      update public.programacao_servicos set
        reagendamentos = reagendamentos + case when data <> v_data then 1 else 0 end,
        data = v_data, setor = l->>'setor', cadastro_id = nullif(l->>'cadastro_id','')::uuid, cliente = nullif(btrim(l->>'cliente'),''), produto = nullif(btrim(l->>'produto'),''), servico = btrim(l->>'servico'), detalhamento = nullif(btrim(l->>'detalhamento'),''), ponto_id = nullif(l->>'ponto_id','')::uuid, local = nullif(btrim(l->>'local'),''), quantidade = coalesce(nullif(l->>'quantidade','')::numeric,1), equipe_id = nullif(l->>'equipe_id','')::uuid, lider_id = nullif(l->>'lider_id','')::uuid, veiculo_id = nullif(l->>'veiculo_id','')::uuid, ordem_id = nullif(l->>'ordem_id','')::uuid, hora_inicio = nullif(l->>'hora_inicio','')::time, hora_fim = nullif(l->>'hora_fim','')::time, status = coalesce(nullif(l->>'status',''),'Programado'), observacao = nullif(btrim(l->>'observacao'),''), posicao = coalesce(nullif(l->>'posicao','')::int, v_pos)
      where id = v_id;
      if not found then raise exception 'Linha %: serviço não encontrado', v_pos; end if;
      delete from public.programacao_servicos_ajudantes where servico_id = v_id;
    end if;
    insert into public.programacao_servicos_ajudantes (servico_id, colaborador_id)
    select distinct v_id, value::uuid from jsonb_array_elements_text(coalesce(l->'ajudantes','[]'::jsonb))
    where value::uuid is distinct from nullif(l->>'lider_id','')::uuid;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
REVOKE EXECUTE ON FUNCTION public.salvar_programacao_lote(jsonb, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_programacao_lote(jsonb, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.reagendar_programacao(servico_uuid uuid, nova_data date, nova_equipe uuid DEFAULT NULL, novo_lider uuid DEFAULT NULL, novo_veiculo uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
begin
  if not public.is_membro(auth.uid()) then raise exception 'Acesso restrito aos membros da equipe'; end if;
  if nova_data is null then raise exception 'Informe a nova data'; end if;
  update public.programacao_servicos set
    data = nova_data, status = 'Programado', reagendamentos = reagendamentos + 1,
    equipe_id = coalesce(nova_equipe, equipe_id), lider_id = coalesce(novo_lider, lider_id), veiculo_id = coalesce(novo_veiculo, veiculo_id)
  where id = servico_uuid;
  if not found then raise exception 'Serviço não encontrado'; end if;
end;
$$;
REVOKE EXECUTE ON FUNCTION public.reagendar_programacao(uuid, date, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reagendar_programacao(uuid, date, uuid, uuid, uuid) TO authenticated;