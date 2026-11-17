# PattyOne — Status

## Implementado
- Autenticação por e-mail e senha (login, cadastro, recuperação de senha), sem confirmação de e-mail. Senhas vazadas são recusadas no cadastro e na troca de senha.
- Novos usuários recebem papel comum (`user`); administradores existentes permanecem inalterados.
- Layout com sidebar flutuante (recolhível, Ctrl/Cmd+B, drawer no mobile), topbar com breadcrumb, busca, tema e avatar.
- Tema claro/escuro/automático.
- Configurações: aparência, perfil (nome salvo no login e na tabela de perfis), sair.
- Cadastros: lista paginada (50/página), busca única, filtros (vendedor, estado, tipo, sem vendedor), seleção em massa com "Atribuir vendedor", ficha em abas (Dados gerais, Contatos, Endereço com ViaCEP, Fiscal/Comissão, Bancário só para admin), máscaras e validação de CPF/CNPJ duplicado.
- Importar dados (só admin): CSV com BOM, aspas e quebras de linha, conversões S/N e numéricas, upsert por CPF/CNPJ ou ID SIGE, lotes de 500, contadores e download dos erros.
- Comercial: propostas e pedidos de venda com empresa do grupo, itens (Mídia OOH, Produção, Serviço, Item livre), descontos, PDF e proposta → pedido.
- Histórico comercial SIGE em Comercial → Histórico SIGE: 80 propostas, 27 contratos autorizados e 197 reservas, com 8 repetições unificadas e 7 vínculos explícitos de proposta/autorização. Valores, datas, situações e arquivos originais preservados; reimportação conferida sem duplicações. 46 registros sem vínculo cadastral único, 217 sem empresa informada e 1 de CHILDA DECOR sem empresa do grupo associada; não foram inventados itens, vencimentos ou ocupações.
- Mídia OOH: pontos com tipos, fotos, mapa (Google Maps) e situação; controle de bi-semanas (livre/reservado/ocupado) com filtros por bi-semana e situação.
- Produção: criação e acompanhamento de ordens de instalação e impressão, com vínculo opcional a pedido/cliente, serviço SIGE, equipe, veículo, prioridade, previsão, etapas, progresso e histórico. Conclusão só com todas as etapas finalizadas.
- Alertas de Produção: central com ordens ativas atrasadas ou com vencimento hoje e nos próximos 3 dias, filtro por tipo, destaques na lista e aviso na ficha. Fluxo autenticado verificado com instalação e impressão; ordens temporárias removidas e 55 testes aprovados.
- Planejamento: cronograma diário, semanal e mensal de equipes e veículos, com busca, filtros, ordens ainda não agendadas, períodos e horários. Agendamentos, edições, exclusões e reservas para urgências são protegidos; urgências podem consumir reservas, mas conflitos com trabalhos comuns são bloqueados.
- Equipes do Planejamento: cadastro administrativo por setor, capacidade em horas/dia, colaboradores e veículos, com ativação/inativação. A equipe selecionada preenche os recursos do agendamento automaticamente e pode ser filtrada no cronograma. Fluxo autenticado de cadastro e agendamento verificado, dados temporários removidos e 71 testes aprovados.
- Programação: Planejamento → Produtos e serviços permite incluir, editar, ativar/inativar e excluir opções. Excluir item já usado apenas o desativa, preservando o histórico. Agendamentos aparecem identificados no lançamento e no resumo diário. “Ordem de produção” está explicada como vínculo opcional.
- Ajustes da Programação: funcionário ou veículo em vários serviços no mesmo dia gera somente aviso âmbar e diálogo de confirmação, sem bloquear o salvamento; após confirmar, a linha mostra “N serviços no dia”. Nova linha vem vazia, exceto pela data. A data pode ser editada na linha ou em “Alterar data”, preservando o mesmo ID e todos os vínculos e repetindo a verificação. Nomes são exibidos como primeiro e segundo nome, pulando preposições, com nome completo no tooltip; o cadastro não é alterado. Fluxo autenticado verificado com três serviços temporários, incluindo cancelamento sem salvar e mudança para data com o mesmo funcionário; registros removidos e 105 testes aprovados.
- Veículos: Planejamento → Veículos permite incluir, editar placa, apelido, modelo, marca, equipe padrão e observações, desativar e excluir. Veículo com histórico é apenas desativado e some das novas seleções.
- Imagens operacionais: várias imagens JPG, PNG, WEBP ou GIF de até 10 MB por serviço programado ou agendamento, em armazenamento privado. Miniaturas aparecem na grade e no resumo; `/img/<id>` é um endereço estável que renova o acesso assinado de 5 minutos a cada clique. Abertura sem login e miniaturas de 240×240 verificadas.
- WhatsApp: envio individual por equipe/veículo e envio do dia completo, reunindo todos os setores, serviços e agendamentos, ordenados por equipe, veículo e horário, com observações, locais e links das imagens. Cópia e abertura do `wa.me` verificadas.
- Verificação desta etapa: fluxos autenticados de catálogos, veículos, serviço e agendamento com imagem executados no navegador; 99 testes passaram, typecheck e build íntegros, temporários removidos. A conferência extra do rótulo de veículo desativado dentro de um agendamento antigo não foi concluída.
- Recursos de Produção importados: 40 colaboradores (sem salários), 14 veículos (11 ativos), 166 serviços e 13 categorias de mão de obra.
- Dashboard com indicadores (números ainda ilustrativos, fixos).

## Módulos em "Em breve" (LockedScreen)
Balcão, Compras e Estoque, Administrativo, Painel de Gestão, Relatórios.

## Banco de dados
- `profiles`, `user_roles` (+ função `has_role`, trigger `on_auth_user_created`)
- `cadastros`, `cadastros_bancario` (bancário só para admin)
- `empresas`, `vendas`, `vendas_itens` (propostas e pedidos, com `tipo`)
- `tipos_midia`, `pontos_midia`, `pontos_midia_fotos`, `pontos_ocupacao`
- `ordens_producao`, equipe, etapas e eventos; `producao_colaboradores`, `producao_veiculos`, `producao_servicos`, `producao_mao_obra`
- `planejamento_agendamentos` e `planejamento_agendamento_equipe`, com rotinas protegidas para salvar, validar conflitos e excluir.
- `producao_equipes`, `producao_equipe_colaboradores` e `producao_equipe_veiculos`, com leitura para membros e gerenciamento somente por administradores.
- `programacao_produtos` e `planejamento_imagens`; catálogos gerenciados por administradores e imagens no bucket privado `planejamento-imagens`, com leitura pela equipe e exclusão pelo autor ou administrador.
- SIGE importado: 3.609 cadastros, 98 entradas de restrição associadas a 100 cadastros (dois nomes possuem dois registros), 503 pontos atuais e 403 históricos cancelados preservados separadamente por códigos reutilizados.
- Coordenadas disponíveis em 399 pontos; 393 endereços cruzados pelo código, 110 sem correspondência no arquivo de endereços usam a descrição original. UF não inferida.
- Calendário oficial: 235 períodos de 2019 a 2027, com códigos pares SIGE e datas originais; telas utilizam esse calendário.
- Verificação autenticada: lista e ficha com restrição, totais de mídia e B46 de 02/11 a 15/11/2026. 20 testes passaram. Mapa permaneceu em branco no ambiente de conferência; renderização dos marcadores não verificada.

## Próximos passos
- Revisar históricos com códigos reutilizados e completar coordenadas/endereço/UF ausentes nos arquivos SIGE.
- Financeiro (a receber / a pagar / comissões) — módulo mais pesado que falta.
- Substituir os números fixos do Dashboard por consultas reais.
- Balcão, Compras e Estoque, Administrativo, Painel de Gestão, Relatórios.
