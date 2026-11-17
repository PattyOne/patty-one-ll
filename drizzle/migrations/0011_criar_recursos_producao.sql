create table public.producao_colaboradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  empresa text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.producao_colaboradores to authenticated;
grant all on public.producao_colaboradores to service_role;
alter table public.producao_colaboradores enable row level security;
create policy "producao_colaboradores_select" on public.producao_colaboradores for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_colaboradores_admin" on public.producao_colaboradores for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.producao_veiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null unique,
  modelo text,
  marca text,
  cor text,
  renavam text,
  status text not null default 'ATIVO',
  seguro_vencimento date,
  created_at timestamptz not null default now()
);
grant select on public.producao_veiculos to authenticated;
grant all on public.producao_veiculos to service_role;
alter table public.producao_veiculos enable row level security;
create policy "producao_veiculos_select" on public.producao_veiculos for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_veiculos_admin" on public.producao_veiculos for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.producao_servicos (
  id uuid primary key default gen_random_uuid(),
  id_sige integer not null unique,
  nome text not null,
  produto text,
  etapas jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.producao_servicos to authenticated;
grant all on public.producao_servicos to service_role;
alter table public.producao_servicos enable row level security;
create policy "producao_servicos_select" on public.producao_servicos for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_servicos_admin" on public.producao_servicos for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.producao_mao_obra (
  id uuid primary key default gen_random_uuid(),
  categoria text not null unique,
  valor numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.producao_mao_obra to authenticated;
grant all on public.producao_mao_obra to service_role;
alter table public.producao_mao_obra enable row level security;
create policy "producao_mao_obra_select" on public.producao_mao_obra for select to authenticated using (public.is_membro(auth.uid()));
create policy "producao_mao_obra_admin" on public.producao_mao_obra for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));