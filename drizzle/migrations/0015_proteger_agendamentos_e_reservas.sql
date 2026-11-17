create or replace function public.salvar_planejamento(dados jsonb, agendamento_uuid uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_titulo text := btrim(coalesce(dados->>'titulo', ''));
  v_tipo text := coalesce(nullif(dados->>'tipo', ''), 'Agendamento');
  v_inicio date;
  v_fim date;
  v_hora_inicio time := nullif(dados->>'hora_inicio', '')::time;
  v_hora_fim time := nullif(dados->>'hora_fim', '')::time;
  v_veiculo uuid := nullif(dados->>'veiculo_id', '')::uuid;
  v_ordem uuid := nullif(dados->>'ordem_id', '')::uuid;
  v_equipe uuid[];
  v_conflito record;
begin
  if not public.is_membro(auth.uid()) then
    raise exception 'Acesso restrito aos membros da equipe';
  end if;
  if v_titulo = '' then raise exception 'Informe o título do agendamento'; end if;
  if v_tipo not in ('Agendamento', 'Reserva de urgência', 'Urgência') then raise exception 'Tipo de agendamento inválido'; end if;
  if nullif(dados->>'data_inicio', '') is null or nullif(dados->>'data_fim', '') is null then raise exception 'Informe o período do agendamento'; end if;
  v_inicio := (dados->>'data_inicio')::date;
  v_fim := (dados->>'data_fim')::date;
  if v_fim < v_inicio then raise exception 'A data final deve ser igual ou posterior à inicial'; end if;
  if (v_hora_inicio is null) <> (v_hora_fim is null) then raise exception 'Preencha o horário inicial e final, ou deixe ambos vazios'; end if;
  if v_hora_inicio is not null and v_hora_fim <= v_hora_inicio then raise exception 'O horário final deve ser posterior ao inicial'; end if;

  select coalesce(array_agg(distinct value::uuid), '{}'::uuid[]) into v_equipe
  from jsonb_array_elements_text(coalesce(dados->'equipe', '[]'::jsonb));
  if coalesce(array_length(v_equipe, 1), 0) = 0 and v_veiculo is null then raise exception 'Selecione pelo menos um colaborador ou um veículo'; end if;
  if exists (
    select 1 from unnest(v_equipe) as ids(id)
    left join public.producao_colaboradores c on c.id = ids.id
    where c.id is null or not c.ativo
  ) then raise exception 'A equipe contém um colaborador inválido ou inativo'; end if;
  if v_veiculo is not null and not exists (select 1 from public.producao_veiculos where id = v_veiculo and status = 'ATIVO') then raise exception 'Selecione um veículo ativo'; end if;
  if v_ordem is not null and not exists (select 1 from public.ordens_producao where id = v_ordem) then raise exception 'Ordem de produção não encontrada'; end if;

  perform pg_advisory_xact_lock(724601);
  if v_ordem is not null and exists (
    select 1 from public.planejamento_agendamentos
    where ordem_id = v_ordem and (agendamento_uuid is null or id <> agendamento_uuid)
  ) then raise exception 'Esta ordem de produção já possui um agendamento'; end if;

  select a.id, a.titulo, a.tipo into v_conflito
  from public.planejamento_agendamentos a
  where (agendamento_uuid is null or a.id <> agendamento_uuid)
    and a.data_inicio <= v_fim and a.data_fim >= v_inicio
    and (
      (v_veiculo is not null and a.veiculo_id = v_veiculo)
      or exists (
        select 1 from public.planejamento_agendamento_equipe e
        where e.agendamento_id = a.id and e.colaborador_id = any(v_equipe)
      )
    )
    and (
      v_hora_inicio is null or a.hora_inicio is null
      or (v_hora_inicio < a.hora_fim and v_hora_fim > a.hora_inicio)
    )
    and (v_tipo <> 'Urgência' or a.tipo <> 'Reserva de urgência')
  order by a.data_inicio, a.hora_inicio nulls first
  limit 1;
  if found then raise exception 'Conflito com o agendamento "%" (%). Escolha outro recurso ou horário', v_conflito.titulo, v_conflito.tipo; end if;

  if agendamento_uuid is null then
    insert into public.planejamento_agendamentos (
      titulo, tipo, data_inicio, data_fim, hora_inicio, hora_fim,
      veiculo_id, ordem_id, observacao, created_by
    ) values (
      v_titulo, v_tipo, v_inicio, v_fim, v_hora_inicio, v_hora_fim,
      v_veiculo, v_ordem, nullif(btrim(coalesce(dados->>'observacao', '')), ''), auth.uid()
    ) returning id into v_id;
  else
    update public.planejamento_agendamentos set
      titulo = v_titulo, tipo = v_tipo, data_inicio = v_inicio, data_fim = v_fim,
      hora_inicio = v_hora_inicio, hora_fim = v_hora_fim, veiculo_id = v_veiculo,
      ordem_id = v_ordem, observacao = nullif(btrim(coalesce(dados->>'observacao', '')), '')
    where id = agendamento_uuid returning id into v_id;
    if not found then raise exception 'Agendamento não encontrado'; end if;
  end if;

  delete from public.planejamento_agendamento_equipe where agendamento_id = v_id;
  insert into public.planejamento_agendamento_equipe (agendamento_id, colaborador_id)
  select v_id, equipe.colaborador_id from unnest(v_equipe) as equipe(colaborador_id);
  return v_id;
end;
$$;
revoke all on function public.salvar_planejamento(jsonb, uuid) from public, anon;
grant execute on function public.salvar_planejamento(jsonb, uuid) to authenticated;

create or replace function public.excluir_planejamento(agendamento_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_membro(auth.uid()) then raise exception 'Acesso restrito aos membros da equipe'; end if;
  delete from public.planejamento_agendamentos where id = agendamento_uuid;
  if not found then raise exception 'Agendamento não encontrado'; end if;
end;
$$;
revoke all on function public.excluir_planejamento(uuid) from public, anon;
grant execute on function public.excluir_planejamento(uuid) to authenticated;