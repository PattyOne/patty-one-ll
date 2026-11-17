drop policy planejamento_imagens_storage_delete on storage.objects;
create policy planejamento_imagens_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'planejamento-imagens' and (
    public.has_role(auth.uid(), 'admin')
    or (owner_id = auth.uid()::text and exists (select 1 from public.planejamento_imagens i where i.storage_path = name))
  )
);