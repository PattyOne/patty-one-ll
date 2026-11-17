ALTER TABLE public.producao_veiculos
  ADD COLUMN apelido text,
  ADD COLUMN equipe_id uuid REFERENCES public.producao_equipes(id) ON DELETE SET NULL,
  ADD COLUMN observacao text;

CREATE INDEX producao_veiculos_equipe_id_idx ON public.producao_veiculos(equipe_id);

CREATE OR REPLACE FUNCTION public.excluir_item_catalogo_programacao(p_tipo text, p_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
  v_usado boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Somente administradores podem excluir itens do catálogo.';
  END IF;

  IF p_tipo = 'produto' THEN
    SELECT nome INTO v_nome FROM public.programacao_produtos WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado.'; END IF;
    SELECT EXISTS (SELECT 1 FROM public.programacao_servicos WHERE produto = v_nome) INTO v_usado;
    IF v_usado THEN
      UPDATE public.programacao_produtos SET ativo = false, updated_at = now() WHERE id = p_id;
      RETURN 'desativado';
    END IF;
    DELETE FROM public.programacao_produtos WHERE id = p_id;
    RETURN 'excluido';
  ELSIF p_tipo = 'servico' THEN
    SELECT nome INTO v_nome FROM public.producao_servicos WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Serviço não encontrado.'; END IF;
    SELECT EXISTS (SELECT 1 FROM public.programacao_servicos WHERE servico = v_nome)
      OR EXISTS (SELECT 1 FROM public.ordens_producao WHERE servico_id = p_id)
      INTO v_usado;
    IF v_usado THEN
      UPDATE public.producao_servicos SET ativo = false WHERE id = p_id;
      RETURN 'desativado';
    END IF;
    DELETE FROM public.producao_servicos WHERE id = p_id;
    RETURN 'excluido';
  END IF;

  RAISE EXCEPTION 'Tipo de catálogo inválido.';
END;
$$;

REVOKE ALL ON FUNCTION public.excluir_item_catalogo_programacao(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_item_catalogo_programacao(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.excluir_veiculo(p_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usado boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Somente administradores podem excluir veículos.';
  END IF;

  PERFORM 1 FROM public.producao_veiculos WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Veículo não encontrado.'; END IF;

  SELECT EXISTS (SELECT 1 FROM public.programacao_servicos WHERE veiculo_id = p_id)
    OR EXISTS (SELECT 1 FROM public.planejamento_agendamentos WHERE veiculo_id = p_id)
    OR EXISTS (SELECT 1 FROM public.ordens_producao WHERE veiculo_id = p_id)
    INTO v_usado;

  IF v_usado THEN
    UPDATE public.producao_veiculos SET status = 'INATIVO' WHERE id = p_id;
    RETURN 'desativado';
  END IF;

  DELETE FROM public.producao_equipe_veiculos WHERE veiculo_id = p_id;
  DELETE FROM public.producao_veiculos WHERE id = p_id;
  RETURN 'excluido';
END;
$$;

REVOKE ALL ON FUNCTION public.excluir_veiculo(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_veiculo(uuid) TO authenticated;