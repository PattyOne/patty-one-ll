CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _user_id IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_membro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _user_id IS NOT NULL AND _user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','user'))
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_membro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_membro(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS tipos_select ON public.tipos_midia;
CREATE POLICY tipos_select ON public.tipos_midia FOR SELECT TO authenticated
  USING (public.is_membro(auth.uid()));

DROP POLICY IF EXISTS pontos_storage_insert ON storage.objects;
CREATE POLICY pontos_storage_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pontos-midia' AND owner_id = (select auth.uid()::text) AND public.is_membro(auth.uid()));