CREATE OR REPLACE FUNCTION public.is_membro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','user'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_membro(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_membro(uuid) TO authenticated;

DROP POLICY IF EXISTS fotos_delete ON public.pontos_midia_fotos;
DROP POLICY IF EXISTS fotos_insert ON public.pontos_midia_fotos;
DROP POLICY IF EXISTS fotos_select ON public.pontos_midia_fotos;
CREATE POLICY fotos_select ON public.pontos_midia_fotos FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY fotos_insert ON public.pontos_midia_fotos FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY fotos_delete ON public.pontos_midia_fotos FOR DELETE TO authenticated USING (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS vendas_itens_select ON public.vendas_itens;
DROP POLICY IF EXISTS vendas_itens_insert ON public.vendas_itens;
DROP POLICY IF EXISTS vendas_itens_update ON public.vendas_itens;
DROP POLICY IF EXISTS vendas_itens_delete ON public.vendas_itens;
CREATE POLICY vendas_itens_select ON public.vendas_itens FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY vendas_itens_insert ON public.vendas_itens FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY vendas_itens_update ON public.vendas_itens FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY vendas_itens_delete ON public.vendas_itens FOR DELETE TO authenticated USING (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS pontos_select ON public.pontos_midia;
DROP POLICY IF EXISTS pontos_insert ON public.pontos_midia;
DROP POLICY IF EXISTS pontos_update ON public.pontos_midia;
CREATE POLICY pontos_select ON public.pontos_midia FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY pontos_insert ON public.pontos_midia FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY pontos_update ON public.pontos_midia FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS vendas_select ON public.vendas;
DROP POLICY IF EXISTS vendas_insert ON public.vendas;
DROP POLICY IF EXISTS vendas_update ON public.vendas;
CREATE POLICY vendas_select ON public.vendas FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY vendas_insert ON public.vendas FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY vendas_update ON public.vendas FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS empresas_select ON public.empresas;
CREATE POLICY empresas_select ON public.empresas FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS cadastros_select ON public.cadastros;
DROP POLICY IF EXISTS cadastros_insert ON public.cadastros;
DROP POLICY IF EXISTS cadastros_update ON public.cadastros;
CREATE POLICY cadastros_select ON public.cadastros FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY cadastros_insert ON public.cadastros FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY cadastros_update ON public.cadastros FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS ocupacao_select ON public.pontos_ocupacao;
DROP POLICY IF EXISTS ocupacao_insert ON public.pontos_ocupacao;
DROP POLICY IF EXISTS ocupacao_update ON public.pontos_ocupacao;
DROP POLICY IF EXISTS ocupacao_delete ON public.pontos_ocupacao;
CREATE POLICY ocupacao_select ON public.pontos_ocupacao FOR SELECT TO authenticated USING (public.is_membro(auth.uid()));
CREATE POLICY ocupacao_insert ON public.pontos_ocupacao FOR INSERT TO authenticated WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY ocupacao_update ON public.pontos_ocupacao FOR UPDATE TO authenticated USING (public.is_membro(auth.uid())) WITH CHECK (public.is_membro(auth.uid()));
CREATE POLICY ocupacao_delete ON public.pontos_ocupacao FOR DELETE TO authenticated USING (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS pontos_storage_select ON storage.objects;
DROP POLICY IF EXISTS pontos_storage_delete ON storage.objects;
CREATE POLICY pontos_storage_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pontos-midia' AND public.is_membro(auth.uid()));
CREATE POLICY pontos_storage_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pontos-midia' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(), 'admin')));