create table public.planejamento_agendamentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(btrim(titulo)) > 0),
  tipo text not null default 'Agendamento' check (tipo in ('Agendamento', 'Reserva de urgência', 'Urgência')),
  data_inicio date not null,
  data_fim date not null,
  hora_inicio time,
  hora_fim time,
  veiculo_id uuid references public.producao_veiculos(id) on delete set null,
  ordem_id uuid references public.ordens_producao(id) on delete set null,
  observacao text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planejamento_periodo_valido check (data_fim >= data_inicio),
  constraint planejamento_horarios_preenchidos check ((hora_inicio is null) = (hora_fim is null)),
  constraint planejamento_horario_valido check (hora_inicio is null or hora_fim > hora_inicio)
);
create unique index planejamento_ordem_unica_idx on public.planejamento_agendamentos(ordem_id) where ordem_id is not null;
create index planejamento_periodo_idx on public.planejamento_agendamentos(data_inicio, data_fim);
create index planejamento_veiculo_periodo_idx on public.planejamento_agendamentos(veiculo_id, data_inicio, data_fim) where veiculo_id is not null;
grant select on public.planejamento_agendamentos to authenticated;
grant all on public.planejamento_agendamentos to service_role;
alter table public.planejamento_agendamentos enable row level security;
create policy "planejamento_select" on public.planejamento_agendamentos for select to authenticated using (public.is_membro(auth.uid()));
create trigger planejamento_agendamentos_touch before update on public.planejamento_agendamentos for each row execute function public.touch_updated_at();

create table public.planejamento_agendamento_equipe (
  agendamento_id uuid not null references public.planejamento_agendamentos(id) on delete cascade,
  colaborador_id uuid not null references public.producao_colaboradores(id) on delete restrict,
  primary key (agendamento_id, colaborador_id)
);
create index planejamento_equipe_colaborador_idx on public.planejamento_agendamento_equipe(colaborador_id, agendamento_id);
grant select on public.planejamento_agendamento_equipe to authenticated;
grant all on public.planejamento_agendamento_equipe to service_role;
alter table public.planejamento_agendamento_equipe enable row level security;
create policy "planejamento_equipe_select" on public.planejamento_agendamento_equipe for select to authenticated using (public.is_membro(auth.uid()));