<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Auth state lives in `src/hooks/useAuth.tsx` (AuthProvider in __root); protected pages are flat `_authenticated.*.tsx` routes gated client-side by `src/routes/_authenticated.tsx` (ssr: false) — session is in localStorage.
- Colors are HSL tokens in `src/styles.css` consumed via `hsl(var(--token))`/theme utilities — avoid literal colors in components (`AuthLayout.tsx` still has a few).
- Roles live only in `public.user_roles` (checked with `has_role`), never on profiles.
- Registry data uses authenticated server functions for initial queries and database RPCs for atomic saves, imports and bulk assignment; this keeps pagination and mutations database-side under RLS.
- Bank details remain separate from general registry data and are fetched only after a database admin-role check; this prevents ordinary users from receiving sensitive fields.
- Registry detail query caches include the authenticated user ID; this prevents bank data cached by an administrator from being reused after an account switch.
- CSV normalization is shared in a browser-safe module and tested independently; this keeps import conversions consistent and rejects invalid values before persistence.
- Proposals and sales orders share one `vendas` table (with `tipo`) and items in `vendas_itens`, saved atomically via `salvar_venda`/`converter_proposta` RPCs; totals are computed in the tested `src/lib/vendas-calc.ts` so screen and PDF always match.
- Mídia OOH: pontos in `pontos_midia` (typed by `tipos_midia`), photos in private bucket `pontos-midia` served via signed URLs; maps use the Google Maps JS loader in `src/components/midia/googleMaps.ts`, lazy-loaded behind ClientOnly so SSR never touches `window`.
- Official periods come from `calendario_bissemanas`; occupancy stores ordinal `numero` while the UI displays `codigo_sige`, preserving even-numbered legacy labels without violating occupancy keys.
- SIGE media keep original IDs and source metadata; cancelled rows use separate stable historical IDs when location and type do not match an active row, avoiding false cancellation of reused codes.
- SIGE restriction flags are import-owned, read-only in registry forms and excluded from normal save payloads so editing contact details cannot clear them.
- Financeiro (`contas_receber`, `contratos_aluguel`, `contratos_energia`) is read client-side under RLS (route is client-only); due/overdue and monthly-rent rules live in tested `src/lib/financeiro.ts`.
- SIGE commercial exports live in a read-only `historico_comercial_sige` archive, deduplicated by proposal/authorization key; preserve original amounts/statuses and explicit proposal links without inventing items, company ownership, receivables or occupancy periods.
- Production orders use `ordens_producao` with team, steps and timeline tables, saved through `salvar_ordem_producao`; service workflows come from SIGE and completion requires every step to be checked.
- Operational planning stores allocations in `planejamento_agendamentos` and their teams in `planejamento_agendamento_equipe`; `salvar_planejamento` validates resources and conflicts, allowing an emergency to consume an emergency reserve without overlapping ordinary work.
- Service programming lives in `programacao_servicos` (+ `programacao_servicos_ajudantes`), saved in batch via `salvar_programacao_lote`; same-day employee/vehicle reuse is an amber warning computed by the tested `detectarConflitos` in `src/lib/programacao.ts`, never a save blocker, and `conflito_confirmado` records confirmation so confirmed rows show only a service-count badge. New rows are fresh blank objects except for the selected date; date edits keep the same service ID and links and rerun the warning check. Product options use `programacao_produtos`, service options reuse `producao_servicos`, and deleting a used catalog item deactivates it to preserve history. Vehicles are managed in `producao_veiculos` with optional default team and are deactivated instead of deleted when referenced. Operational images use `planejamento_imagens` with the private `planejamento-imagens` bucket; the public `/img/$id` route issues a fresh five-minute signed redirect on every click so stable WhatsApp links keep working. Appointments appear as identified read-only items in the daily service summary. Display-only employee abbreviations use `src/lib/nomes.ts` and never change stored names.
