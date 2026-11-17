create table public.programacao_produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index programacao_produtos_nome_unico on public.programacao_produtos (lower(btrim(nome)));
grant select on public.programacao_produtos to authenticated;
grant insert, update, delete on public.programacao_produtos to authenticated;
grant all on public.programacao_produtos to service_role;
alter table public.programacao_produtos enable row level security;
create policy programacao_produtos_select on public.programacao_produtos for select to authenticated using (public.is_membro(auth.uid()));
create policy programacao_produtos_admin on public.programacao_produtos for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger programacao_produtos_touch before update on public.programacao_produtos for each row execute function public.touch_updated_at();

create table public.planejamento_imagens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  programacao_id uuid references public.programacao_servicos(id) on delete cascade,
  agendamento_id uuid references public.planejamento_agendamentos(id) on delete cascade,
  storage_path text not null unique,
  nome text not null,
  content_type text not null,
  tamanho integer not null check (tamanho > 0 and tamanho <= 10485760),
  created_at timestamptz not null default now(),
  check (num_nonnulls(programacao_id, agendamento_id) = 1)
);
create index planejamento_imagens_programacao_idx on public.planejamento_imagens(programacao_id) where programacao_id is not null;
create index planejamento_imagens_agendamento_idx on public.planejamento_imagens(agendamento_id) where agendamento_id is not null;
grant select, insert, delete on public.planejamento_imagens to authenticated;
grant all on public.planejamento_imagens to service_role;
alter table public.planejamento_imagens enable row level security;
create policy planejamento_imagens_select on public.planejamento_imagens for select to authenticated using (public.is_membro(auth.uid()));
create policy planejamento_imagens_insert on public.planejamento_imagens for insert to authenticated with check (
  public.is_membro(auth.uid()) and owner_id = auth.uid() and (
    (programacao_id is not null and exists (select 1 from public.programacao_servicos s where s.id = programacao_id and public.is_membro(auth.uid())))
    or
    (agendamento_id is not null and exists (select 1 from public.planejamento_agendamentos a where a.id = agendamento_id and public.is_membro(auth.uid())))
  )
);
create policy planejamento_imagens_delete on public.planejamento_imagens for delete to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy planejamento_imagens_storage_select on storage.objects for select to authenticated using (
  bucket_id = 'planejamento-imagens' and public.is_membro(auth.uid()) and exists (
    select 1 from public.planejamento_imagens i where i.storage_path = name and public.is_membro(auth.uid())
  )
);
create policy planejamento_imagens_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'planejamento-imagens' and public.is_membro(auth.uid()) and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
  and coalesce(metadata->>'mimetype', '') like 'image/%'
);
create policy planejamento_imagens_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'planejamento-imagens' and (owner_id = auth.uid()::text or public.has_role(auth.uid(), 'admin')) and exists (
    select 1 from public.planejamento_imagens i where i.storage_path = name
  )
);

create or replace function public.criar_servico_producao(p_nome text, p_produto text default null)
returns uuid language plpgsql security invoker set search_path to 'public' as $$
declare v_id uuid; v_sige integer;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Somente administradores podem cadastrar serviços'; end if;
  if btrim(coalesce(p_nome, '')) = '' then raise exception 'Informe o nome do serviço'; end if;
  perform pg_advisory_xact_lock(724191);
  select coalesce(max(id_sige), 0) + 1 into v_sige from public.producao_servicos;
  insert into public.producao_servicos (id_sige, nome, produto, etapas, ativo)
  values (v_sige, btrim(p_nome), nullif(btrim(coalesce(p_produto, '')), ''), '[]'::jsonb, true)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.criar_servico_producao(text, text) from public, anon;
grant execute on function public.criar_servico_producao(text, text) to authenticated;