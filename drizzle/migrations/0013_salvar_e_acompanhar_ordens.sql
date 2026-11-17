create or replace function public.salvar_ordem_producao(dados jsonb, ordem_uuid uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_antiga public.ordens_producao%rowtype;
  v_status text := coalesce(nullif(dados->>'status', ''), 'Aguardando');
  v_servico uuid := nullif(dados->>'servico_id', '')::uuid;
  v_etapas_alteradas boolean := false;
begin
  if not public.is_membro(auth.uid()) then
    raise exception 'Acesso restrito aos membros da equipe';
  end if;
  if nullif(btrim(dados->>'descricao'), '') is null then
    raise exception 'Informe a descrição da ordem';
  end if;
  if coalesce(dados->>'tipo', '') not in ('Instalação', 'Impressão') then
    raise exception 'Tipo de ordem inválido';
  end if;
  if dados->>'tipo' = 'Instalação' and nullif(btrim(dados->>'local_instalacao'), '') is null then
    raise exception 'Informe o local da instalação';
  end if;
  if jsonb_array_length(coalesce(dados->'etapas', '[]'::jsonb)) = 0 then
    raise exception 'A ordem precisa de pelo menos uma etapa';
  end if;

  if ordem_uuid is null then
    insert into public.ordens_producao (
      tipo, status, prioridade, venda_id, cadastro_id, servico_id, descricao,
      data_prevista, local_instalacao, veiculo_id, observacao, created_by
    ) values (
      dados->>'tipo', 'Aguardando', coalesce(nullif(dados->>'prioridade', ''), 'Normal'),
      nullif(dados->>'venda_id', '')::uuid, nullif(dados->>'cadastro_id', '')::uuid,
      v_servico, btrim(dados->>'descricao'), nullif(dados->>'data_prevista', '')::date,
      nullif(btrim(dados->>'local_instalacao'), ''), nullif(dados->>'veiculo_id', '')::uuid,
      nullif(dados->>'observacao', ''), auth.uid()
    ) returning id into v_id;
    insert into public.ordens_producao_eventos (ordem_id, tipo, descricao, created_by)
    values (v_id, 'criacao', 'Ordem criada', auth.uid());
  else
    select * into v_antiga from public.ordens_producao where id = ordem_uuid for update;
    if not found then raise exception 'Ordem não encontrada'; end if;
    v_id := ordem_uuid;
    v_etapas_alteradas := v_antiga.servico_id is distinct from v_servico;
    update public.ordens_producao set
      tipo = dados->>'tipo',
      status = v_status,
      prioridade = coalesce(nullif(dados->>'prioridade', ''), 'Normal'),
      venda_id = nullif(dados->>'venda_id', '')::uuid,
      cadastro_id = nullif(dados->>'cadastro_id', '')::uuid,
      servico_id = v_servico,
      descricao = btrim(dados->>'descricao'),
      data_prevista = nullif(dados->>'data_prevista', '')::date,
      data_inicio = case when v_status = 'Em andamento' and data_inicio is null then now() else data_inicio end,
      data_conclusao = case when v_status = 'Concluída' then coalesce(data_conclusao, now()) else null end,
      local_instalacao = nullif(btrim(dados->>'local_instalacao'), ''),
      veiculo_id = nullif(dados->>'veiculo_id', '')::uuid,
      observacao = nullif(dados->>'observacao', '')
    where id = v_id;
    if v_antiga.status is distinct from v_status then
      insert into public.ordens_producao_eventos (ordem_id, tipo, descricao, created_by)
      values (v_id, 'status', format('Situação alterada de %s para %s', v_antiga.status, v_status), auth.uid());
    end if;
  end if;

  delete from public.ordens_producao_equipe where ordem_id = v_id;
  insert into public.ordens_producao_equipe (ordem_id, colaborador_id)
  select v_id, value::uuid from jsonb_array_elements_text(coalesce(dados->'equipe', '[]'::jsonb));

  if ordem_uuid is null or v_etapas_alteradas then
    delete from public.ordens_producao_etapas where ordem_id = v_id;
    insert into public.ordens_producao_etapas (ordem_id, ordem, nome)
    select v_id, (row_number() over ())::integer, value
    from jsonb_array_elements_text(dados->'etapas') with ordinality;
  end if;

  if v_status = 'Concluída' and exists (
    select 1 from public.ordens_producao_etapas where ordem_id = v_id and not concluido
  ) then
    raise exception 'Conclua todas as etapas antes de concluir a ordem';
  end if;
  return v_id;
end;
$$;
revoke all on function public.salvar_ordem_producao(jsonb, uuid) from public, anon;
grant execute on function public.salvar_ordem_producao(jsonb, uuid) to authenticated;

create or replace function public.atualizar_etapa_producao(etapa_uuid uuid, concluida boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ordem uuid;
  v_nome text;
  v_status text;
begin
  if not public.is_membro(auth.uid()) then raise exception 'Acesso restrito aos membros da equipe'; end if;
  select e.ordem_id, e.nome, o.status into v_ordem, v_nome, v_status
  from public.ordens_producao_etapas e join public.ordens_producao o on o.id = e.ordem_id
  where e.id = etapa_uuid for update of e;
  if not found then raise exception 'Etapa não encontrada'; end if;
  if v_status in ('Concluída', 'Cancelada') then raise exception 'Reabra a ordem antes de alterar as etapas'; end if;
  update public.ordens_producao_etapas set
    concluido = concluida,
    concluido_em = case when concluida then now() else null end,
    concluido_por = case when concluida then auth.uid() else null end
  where id = etapa_uuid;
  insert into public.ordens_producao_eventos (ordem_id, tipo, descricao, created_by)
  values (v_ordem, 'etapa', format('Etapa %s: %s', case when concluida then 'concluída' else 'reaberta' end, v_nome), auth.uid());
end;
$$;
revoke all on function public.atualizar_etapa_producao(uuid, boolean) from public, anon;
grant execute on function public.atualizar_etapa_producao(uuid, boolean) to authenticated;