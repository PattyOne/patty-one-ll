create table public.producao_equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) > 0),
  setor text not null check (length(btrim(setor)) > 0),
  capacidade_horas_dia numeric(7,2) not null default 8 check (capacidade_horas_dia > 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nome, setor)
);
grant select on public.producao_equipes to authenticated;
grant all on public.producao_equipes to service_role;
alter table public.producao_equipes enable row level security;
create policy "producao_equipes_select" on public.producao_equipes for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_equipes_admin" on public.producao_equipes for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger producao_equipes_touch before update on public.producao_equipes for each row execute function public.touch_updated_at();

create table public.producao_equipe_colaboradores (
  equipe_id uuid not null references public.producao_equipes(id) on delete cascade,
  colaborador_id uuid not null references public.producao_colaboradores(id) on delete restrict,
  primary key (equipe_id, colaborador_id)
);
create index producao_equipe_colaborador_idx on public.producao_equipe_colaboradores(colaborador_id, equipe_id);
grant select on public.producao_equipe_colaboradores to authenticated;
grant all on public.producao_equipe_colaboradores to service_role;
alter table public.producao_equipe_colaboradores enable row level security;
create policy "producao_equipe_colaboradores_select" on public.producao_equipe_colaboradores for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_equipe_colaboradores_admin" on public.producao_equipe_colaboradores for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.producao_equipe_veiculos (
  equipe_id uuid not null references public.producao_equipes(id) on delete cascade,
  veiculo_id uuid not null references public.producao_veiculos(id) on delete restrict,
  primary key (equipe_id, veiculo_id)
);
create index producao_equipe_veiculo_idx on public.producao_equipe_veiculos(veiculo_id, equipe_id);
grant select on public.producao_equipe_veiculos to authenticated;
grant all on public.producao_equipe_veiculos to service_role;
alter table public.producao_equipe_veiculos enable row level security;
create policy "producao_equipe_veiculos_select" on public.producao_equipe_veiculos for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_equipe_veiculos_admin" on public.producao_equipe_veiculos for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

alter table public.planejamento_agendamentos add column equipe_id uuid references public.producao_equipes(id) on delete set null;
create index planejamento_equipe_periodo_idx on public.planejamento_agendamentos(equipe_id, data_inicio, data_fim) where equipe_id is not null;

create or replace function public.salvar_equipe_producao(dados jsonb, equipe_uuid uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_nome text := btrim(coalesce(dados->>'nome', ''));
  v_setor text := btrim(coalesce(dados->>'setor', ''));
  v_capacidade numeric := coalesce((dados->>'capacidade_horas_dia')::numeric, 0);
  v_ativo boolean := coalesce((dados->>'ativo')::boolean, true);
  v_colaboradores uuid[];
  v_veiculos uuid[];
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Somente administradores podem gerenciar equipes'; end if;
  if v_nome = '' then raise exception 'Informe o nome da equipe'; end if;
  if v_setor = '' then raise exception 'Informe o setor da equipe'; end if;
  if v_capacidade <= 0 then raise exception 'A capacidade diária deve ser maior que zero'; end if;

  select coalesce(array_agg(distinct value::uuid), '{}'::uuid[]) into v_colaboradores
  from jsonb_array_elements_text(coalesce(dados->'colaboradores', '[]'::jsonb));
  select coalesce(array_agg(distinct value::uuid), '{}'::uuid[]) into v_veiculos
  from jsonb_array_elements_text(coalesce(dados->'veiculos', '[]'::jsonb));
  if coalesce(array_length(v_colaboradores, 1), 0) = 0 and coalesce(array_length(v_veiculos, 1), 0) = 0 then
    raise exception 'Selecione pelo menos um colaborador ou um veículo';
  end if;
  if exists (
    select 1 from unnest(v_colaboradores) as ids(id)
    left join public.producao_colaboradores c on c.id = ids.id
    where c.id is null or not c.ativo
  ) then raise exception 'A equipe contém um colaborador inválido ou inativo'; end if;
  if exists (
    select 1 from unnest(v_veiculos) as ids(id)
    left join public.producao_veiculos v on v.id = ids.id
    where v.id is null or v.status <> 'ATIVO'
  ) then raise exception 'A equipe contém um veículo inválido ou inativo'; end if;

  if equipe_uuid is null then
    insert into public.producao_equipes (nome, setor, capacidade_horas_dia, ativo)
    values (v_nome, v_setor, v_capacidade, v_ativo) returning id into v_id;
  else
    update public.producao_equipes set nome = v_nome, setor = v_setor, capacidade_horas_dia = v_capacidade, ativo = v_ativo
    where id = equipe_uuid returning id into v_id;
    if not found then raise exception 'Equipe não encontrada'; end if;
  end if;

  delete from public.producao_equipe_colaboradores where equipe_id = v_id;
  insert into public.producao_equipe_colaboradores (equipe_id, colaborador_id)
  select v_id, item.colaborador_id from unnest(v_colaboradores) as item(colaborador_id);
  delete from public.producao_equipe_veiculos where equipe_id = v_id;
  insert into public.producao_equipe_veiculos (equipe_id, veiculo_id)
  select v_id, item.veiculo_id from unnest(v_veiculos) as item(veiculo_id);
  return v_id;
exception
  when unique_violation then raise exception 'Já existe uma equipe com este nome neste setor';
end;
$$;
revoke all on function public.salvar_equipe_producao(jsonb, uuid) from public, anon;
grant execute on function public.salvar_equipe_producao(jsonb, uuid) to authenticated;

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
  v_equipe_id uuid := nullif(dados->>'equipe_id', '')::uuid;
  v_equipe uuid[];
  v_conflito record;
begin
  if not public.is_membro(auth.uid()) then raise exception 'Acesso restrito aos membros da equipe'; end if;
  if v_titulo = '' then raise exception 'Informe o título do agendamento'; end if;
  if v_tipo not in ('Agendamento', 'Reserva de urgência', 'Urgência') then raise exception 'Tipo de agendamento inválido'; end if;
  if nullif(dados->>'data_inicio', '') is null or nullif(dados->>'data_fim', '') is null then raise exception 'Informe o período do agendamento'; end if;
  v_inicio := (dados->>'data_inicio')::date;
  v_fim := (dados->>'data_fim')::date;
  if v_fim < v_inicio then raise exception 'A data final deve ser igual ou posterior à inicial'; end if;
  if (v_hora_inicio is null) <> (v_hora_fim is null) then raise exception 'Preencha o horário inicial e final, ou deixe ambos vazios'; end if;
  if v_hora_inicio is not null and v_hora_fim <= v_hora_inicio then raise exception 'O horário final deve ser posterior ao inicial'; end if;

  if v_equipe_id is not null then
    if not exists (select 1 from public.producao_equipes where id = v_equipe_id and ativo) then raise exception 'Selecione uma equipe ativa'; end if;
    select coalesce(array_agg(ec.colaborador_id), '{}'::uuid[]) into v_equipe
    from public.producao_equipe_colaboradores ec where ec.equipe_id = v_equipe_id;
    if v_veiculo is null then
      select ev.veiculo_id into v_veiculo from public.producao_equipe_veiculos ev
      join public.producao_veiculos v on v.id = ev.veiculo_id and v.status = 'ATIVO'
      where ev.equipe_id = v_equipe_id order by v.placa limit 1;
    end if;
    if v_veiculo is not null and not exists (
      select 1 from public.producao_equipe_veiculos where equipe_id = v_equipe_id and veiculo_id = v_veiculo
    ) then raise exception 'O veículo selecionado não pertence à equipe'; end if;
  else
    select coalesce(array_agg(distinct value::uuid), '{}'::uuid[]) into v_equipe
    from jsonb_array_elements_text(coalesce(dados->'equipe', '[]'::jsonb));
  end if;

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
      veiculo_id, ordem_id, equipe_id, observacao, created_by
    ) values (
      v_titulo, v_tipo, v_inicio, v_fim, v_hora_inicio, v_hora_fim,
      v_veiculo, v_ordem, v_equipe_id, nullif(btrim(coalesce(dados->>'observacao', '')), ''), auth.uid()
    ) returning id into v_id;
  else
    update public.planejamento_agendamentos set
      titulo = v_titulo, tipo = v_tipo, data_inicio = v_inicio, data_fim = v_fim,
      hora_inicio = v_hora_inicio, hora_fim = v_hora_fim, veiculo_id = v_veiculo,
      ordem_id = v_ordem, equipe_id = v_equipe_id, observacao = nullif(btrim(coalesce(dados->>'observacao', '')), '')
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