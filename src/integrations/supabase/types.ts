export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cadastros: {
        Row: {
          bairro: string | null
          celular: string | null
          celular2: string | null
          cep: string | null
          cidade: string | null
          codigo_municipio: string | null
          complemento: string | null
          contato: string | null
          contato_financeiro: string | null
          cpf_cnpj: string | null
          cpf_cnpj_digitos: string | null
          created_at: string
          dados_sige: Json | null
          email: string | null
          email_financeiro: string | null
          email2: string | null
          endereco: string | null
          estado: string | null
          id: string
          id_sige: string | null
          ie: string | null
          im: string | null
          is_cliente: boolean | null
          is_fornecedor: boolean | null
          is_prestador: boolean | null
          nome: string
          numero: string | null
          observacao: string | null
          origem: string | null
          percentual_comissao: number | null
          percentual_iss: number | null
          percentual_servicos: number | null
          razao_social: string | null
          restricao_observacao: string | null
          restricao_sige: boolean
          reter_iss: boolean | null
          telefone: string | null
          telefone_financeiro: string | null
          telefone2: string | null
          tipo_comissao: string | null
          tipo_pessoa: string | null
          updated_at: string
          validado: string | null
          vendedor: string | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          celular2?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_municipio?: string | null
          complemento?: string | null
          contato?: string | null
          contato_financeiro?: string | null
          cpf_cnpj?: string | null
          cpf_cnpj_digitos?: string | null
          created_at?: string
          dados_sige?: Json | null
          email?: string | null
          email_financeiro?: string | null
          email2?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          id_sige?: string | null
          ie?: string | null
          im?: string | null
          is_cliente?: boolean | null
          is_fornecedor?: boolean | null
          is_prestador?: boolean | null
          nome: string
          numero?: string | null
          observacao?: string | null
          origem?: string | null
          percentual_comissao?: number | null
          percentual_iss?: number | null
          percentual_servicos?: number | null
          razao_social?: string | null
          restricao_observacao?: string | null
          restricao_sige?: boolean
          reter_iss?: boolean | null
          telefone?: string | null
          telefone_financeiro?: string | null
          telefone2?: string | null
          tipo_comissao?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          validado?: string | null
          vendedor?: string | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          celular2?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_municipio?: string | null
          complemento?: string | null
          contato?: string | null
          contato_financeiro?: string | null
          cpf_cnpj?: string | null
          cpf_cnpj_digitos?: string | null
          created_at?: string
          dados_sige?: Json | null
          email?: string | null
          email_financeiro?: string | null
          email2?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          id_sige?: string | null
          ie?: string | null
          im?: string | null
          is_cliente?: boolean | null
          is_fornecedor?: boolean | null
          is_prestador?: boolean | null
          nome?: string
          numero?: string | null
          observacao?: string | null
          origem?: string | null
          percentual_comissao?: number | null
          percentual_iss?: number | null
          percentual_servicos?: number | null
          razao_social?: string | null
          restricao_observacao?: string | null
          restricao_sige?: boolean
          reter_iss?: boolean | null
          telefone?: string | null
          telefone_financeiro?: string | null
          telefone2?: string | null
          tipo_comissao?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          validado?: string | null
          vendedor?: string | null
        }
        Relationships: []
      }
      cadastros_bancario: {
        Row: {
          agencia: string | null
          banco: string | null
          cadastro_id: string
          cod_banco: string | null
          conta: string | null
          titular: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          cadastro_id: string
          cod_banco?: string | null
          conta?: string | null
          titular?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          cadastro_id?: string
          cod_banco?: string | null
          conta?: string | null
          titular?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cadastros_bancario_cadastro_id_fkey"
            columns: ["cadastro_id"]
            isOneToOne: true
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_bissemanas: {
        Row: {
          ano: number
          codigo_sige: number
          fim: string
          inicio: string
          numero: number
        }
        Insert: {
          ano: number
          codigo_sige: number
          fim: string
          inicio: string
          numero: number
        }
        Update: {
          ano?: number
          codigo_sige?: number
          fim?: string
          inicio?: string
          numero?: number
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          cadastro_id: string | null
          created_at: string
          descricao: string
          empresa_id: string | null
          id: string
          observacao: string | null
          recebido_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
          venda_id: string | null
        }
        Insert: {
          cadastro_id?: string | null
          created_at?: string
          descricao: string
          empresa_id?: string | null
          id?: string
          observacao?: string | null
          recebido_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento: string
          venda_id?: string | null
        }
        Update: {
          cadastro_id?: string | null
          created_at?: string
          descricao?: string
          empresa_id?: string | null
          id?: string
          observacao?: string | null
          recebido_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cadastro_id_fkey"
            columns: ["cadastro_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_aluguel: {
        Row: {
          ativo: boolean
          contrato: string | null
          created_at: string
          id: string
          midias: string | null
          observacao: string | null
          periodicidade: string | null
          proprietario: string
          updated_at: string
          validado: boolean
          valor: number
          vencimento: string | null
          vigencia: string | null
        }
        Insert: {
          ativo?: boolean
          contrato?: string | null
          created_at?: string
          id?: string
          midias?: string | null
          observacao?: string | null
          periodicidade?: string | null
          proprietario: string
          updated_at?: string
          validado?: boolean
          valor?: number
          vencimento?: string | null
          vigencia?: string | null
        }
        Update: {
          ativo?: boolean
          contrato?: string | null
          created_at?: string
          id?: string
          midias?: string | null
          observacao?: string | null
          periodicidade?: string | null
          proprietario?: string
          updated_at?: string
          validado?: boolean
          valor?: number
          vencimento?: string | null
          vigencia?: string | null
        }
        Relationships: []
      }
      contratos_energia: {
        Row: {
          ativo: boolean
          created_at: string
          data_inicio: string | null
          id: string
          local: string | null
          num_cliente: string | null
          num_instalacao: string | null
          observacao: string | null
          titular: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_inicio?: string | null
          id?: string
          local?: string | null
          num_cliente?: string | null
          num_instalacao?: string | null
          observacao?: string | null
          titular?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_inicio?: string | null
          id?: string
          local?: string | null
          num_cliente?: string | null
          num_instalacao?: string | null
          observacao?: string | null
          titular?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      historico_comercial_sige: {
        Row: {
          autorizacao_sige: string | null
          cadastro_id: string | null
          chave_sige: string
          cliente_nome: string
          contrato_sige: string | null
          dados_sige: Json
          data_documento: string
          empresa_id: string | null
          empresa_nome: string | null
          empresa_origem: string | null
          fontes: Json
          id: string
          importado_em: string
          numero_sige: string
          proposta_numero_sige: string | null
          status_sige: string
          tipo: string
          tipo_servico: string | null
          valor: number
          valor_liquido: number | null
          vendedor: string | null
        }
        Insert: {
          autorizacao_sige?: string | null
          cadastro_id?: string | null
          chave_sige: string
          cliente_nome: string
          contrato_sige?: string | null
          dados_sige: Json
          data_documento: string
          empresa_id?: string | null
          empresa_nome?: string | null
          empresa_origem?: string | null
          fontes?: Json
          id?: string
          importado_em?: string
          numero_sige: string
          proposta_numero_sige?: string | null
          status_sige: string
          tipo: string
          tipo_servico?: string | null
          valor: number
          valor_liquido?: number | null
          vendedor?: string | null
        }
        Update: {
          autorizacao_sige?: string | null
          cadastro_id?: string | null
          chave_sige?: string
          cliente_nome?: string
          contrato_sige?: string | null
          dados_sige?: Json
          data_documento?: string
          empresa_id?: string | null
          empresa_nome?: string | null
          empresa_origem?: string | null
          fontes?: Json
          id?: string
          importado_em?: string
          numero_sige?: string
          proposta_numero_sige?: string | null
          status_sige?: string
          tipo?: string
          tipo_servico?: string | null
          valor?: number
          valor_liquido?: number | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_comercial_sige_cadastro_id_fkey"
            columns: ["cadastro_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_comercial_sige_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          cadastro_id: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          data_prevista: string | null
          descricao: string
          id: string
          local_instalacao: string | null
          numero: number
          observacao: string | null
          prioridade: string
          servico_id: string | null
          status: string
          tipo: string
          updated_at: string
          veiculo_id: string | null
          venda_id: string | null
        }
        Insert: {
          cadastro_id?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          data_prevista?: string | null
          descricao: string
          id?: string
          local_instalacao?: string | null
          numero?: number
          observacao?: string | null
          prioridade?: string
          servico_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          veiculo_id?: string | null
          venda_id?: string | null
        }
        Update: {
          cadastro_id?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          data_prevista?: string | null
          descricao?: string
          id?: string
          local_instalacao?: string | null
          numero?: number
          observacao?: string | null
          prioridade?: string
          servico_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          veiculo_id?: string | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_cadastro_id_fkey"
            columns: ["cadastro_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "producao_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "producao_veiculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao_equipe: {
        Row: {
          colaborador_id: string
          ordem_id: string
        }
        Insert: {
          colaborador_id: string
          ordem_id: string
        }
        Update: {
          colaborador_id?: string
          ordem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_equipe_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "producao_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_equipe_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao_etapas: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          concluido_por: string | null
          id: string
          nome: string
          ordem: number
          ordem_id: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          id?: string
          nome: string
          ordem: number
          ordem_id: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          id?: string
          nome?: string
          ordem?: number
          ordem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_etapas_concluido_por_fkey"
            columns: ["concluido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_etapas_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao_eventos: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          ordem_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          ordem_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          ordem_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_eventos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_eventos_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_agendamento_equipe: {
        Row: {
          agendamento_id: string
          colaborador_id: string
        }
        Insert: {
          agendamento_id: string
          colaborador_id: string
        }
        Update: {
          agendamento_id?: string
          colaborador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_agendamento_equipe_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "planejamento_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_agendamento_equipe_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "producao_colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_agendamentos: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string
          data_inicio: string
          equipe_id: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          observacao: string | null
          ordem_id: string | null
          tipo: string
          titulo: string
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_inicio: string
          equipe_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          observacao?: string | null
          ordem_id?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          equipe_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          observacao?: string | null
          ordem_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_agendamentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_agendamentos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "producao_equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_agendamentos_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_agendamentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "producao_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_imagens: {
        Row: {
          agendamento_id: string | null
          content_type: string
          created_at: string
          id: string
          nome: string
          owner_id: string
          programacao_id: string | null
          storage_path: string
          tamanho: number
        }
        Insert: {
          agendamento_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          nome: string
          owner_id?: string
          programacao_id?: string | null
          storage_path: string
          tamanho: number
        }
        Update: {
          agendamento_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          nome?: string
          owner_id?: string
          programacao_id?: string | null
          storage_path?: string
          tamanho?: number
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_imagens_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "planejamento_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_imagens_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_imagens_programacao_id_fkey"
            columns: ["programacao_id"]
            isOneToOne: false
            referencedRelation: "programacao_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_midia: {
        Row: {
          altura: number | null
          bairro: string | null
          cidade: string | null
          codigo: string | null
          codigo_sige: string | null
          created_at: string
          dados_sige: Json | null
          endereco: string | null
          estado: string | null
          faces: number
          id: string
          id_sige: string | null
          iluminado: boolean
          largura: number | null
          latitude: number | null
          longitude: number | null
          nome: string
          observacao: string | null
          referencia: string | null
          status: string
          tipo_id: string
          updated_at: string
        }
        Insert: {
          altura?: number | null
          bairro?: string | null
          cidade?: string | null
          codigo?: string | null
          codigo_sige?: string | null
          created_at?: string
          dados_sige?: Json | null
          endereco?: string | null
          estado?: string | null
          faces?: number
          id?: string
          id_sige?: string | null
          iluminado?: boolean
          largura?: number | null
          latitude?: number | null
          longitude?: number | null
          nome: string
          observacao?: string | null
          referencia?: string | null
          status?: string
          tipo_id: string
          updated_at?: string
        }
        Update: {
          altura?: number | null
          bairro?: string | null
          cidade?: string | null
          codigo?: string | null
          codigo_sige?: string | null
          created_at?: string
          dados_sige?: Json | null
          endereco?: string | null
          estado?: string | null
          faces?: number
          id?: string
          id_sige?: string | null
          iluminado?: boolean
          largura?: number | null
          latitude?: number | null
          longitude?: number | null
          nome?: string
          observacao?: string | null
          referencia?: string | null
          status?: string
          tipo_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_midia_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_midia"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_midia_fotos: {
        Row: {
          created_at: string
          id: string
          path: string
          ponto_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          ponto_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          ponto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_midia_fotos_ponto_id_fkey"
            columns: ["ponto_id"]
            isOneToOne: false
            referencedRelation: "pontos_midia"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_ocupacao: {
        Row: {
          ano: number
          bissemana: number
          cliente: string | null
          created_at: string
          id: string
          observacao: string | null
          ponto_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ano: number
          bissemana: number
          cliente?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          ponto_id: string
          status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ano?: number
          bissemana?: number
          cliente?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          ponto_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_ocupacao_ponto_id_fkey"
            columns: ["ponto_id"]
            isOneToOne: false
            referencedRelation: "pontos_midia"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_colaboradores: {
        Row: {
          ativo: boolean
          created_at: string
          empresa: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      producao_equipe_colaboradores: {
        Row: {
          colaborador_id: string
          equipe_id: string
        }
        Insert: {
          colaborador_id: string
          equipe_id: string
        }
        Update: {
          colaborador_id?: string
          equipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_equipe_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "producao_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_equipe_colaboradores_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "producao_equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_equipe_veiculos: {
        Row: {
          equipe_id: string
          veiculo_id: string
        }
        Insert: {
          equipe_id: string
          veiculo_id: string
        }
        Update: {
          equipe_id?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_equipe_veiculos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "producao_equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_equipe_veiculos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "producao_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_equipes: {
        Row: {
          ativo: boolean
          capacidade_horas_dia: number
          created_at: string
          id: string
          nome: string
          setor: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          capacidade_horas_dia?: number
          created_at?: string
          id?: string
          nome: string
          setor: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          capacidade_horas_dia?: number
          created_at?: string
          id?: string
          nome?: string
          setor?: string
          updated_at?: string
        }
        Relationships: []
      }
      producao_mao_obra: {
        Row: {
          categoria: string
          created_at: string
          id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          valor?: number
        }
        Relationships: []
      }
      producao_servicos: {
        Row: {
          ativo: boolean
          created_at: string
          etapas: Json
          id: string
          id_sige: number
          nome: string
          produto: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          etapas?: Json
          id?: string
          id_sige: number
          nome: string
          produto?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          etapas?: Json
          id?: string
          id_sige?: number
          nome?: string
          produto?: string | null
        }
        Relationships: []
      }
      producao_veiculos: {
        Row: {
          apelido: string | null
          cor: string | null
          created_at: string
          equipe_id: string | null
          id: string
          marca: string | null
          modelo: string | null
          observacao: string | null
          placa: string
          renavam: string | null
          seguro_vencimento: string | null
          status: string
        }
        Insert: {
          apelido?: string | null
          cor?: string | null
          created_at?: string
          equipe_id?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          observacao?: string | null
          placa: string
          renavam?: string | null
          seguro_vencimento?: string | null
          status?: string
        }
        Update: {
          apelido?: string | null
          cor?: string | null
          created_at?: string
          equipe_id?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          observacao?: string | null
          placa?: string
          renavam?: string | null
          seguro_vencimento?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_veiculos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "producao_equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      programacao_produtos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      programacao_servicos: {
        Row: {
          cadastro_id: string | null
          cliente: string | null
          conflito_confirmado: boolean
          created_at: string
          created_by: string | null
          data: string
          data_original: string
          detalhamento: string | null
          equipe_id: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          lider_id: string | null
          local: string | null
          observacao: string | null
          ordem_id: string | null
          ponto_id: string | null
          posicao: number
          produto: string | null
          quantidade: number
          reagendamentos: number
          servico: string
          setor: string
          status: string
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          cadastro_id?: string | null
          cliente?: string | null
          conflito_confirmado?: boolean
          created_at?: string
          created_by?: string | null
          data: string
          data_original: string
          detalhamento?: string | null
          equipe_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          lider_id?: string | null
          local?: string | null
          observacao?: string | null
          ordem_id?: string | null
          ponto_id?: string | null
          posicao?: number
          produto?: string | null
          quantidade?: number
          reagendamentos?: number
          servico: string
          setor: string
          status?: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          cadastro_id?: string | null
          cliente?: string | null
          conflito_confirmado?: boolean
          created_at?: string
          created_by?: string | null
          data?: string
          data_original?: string
          detalhamento?: string | null
          equipe_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          lider_id?: string | null
          local?: string | null
          observacao?: string | null
          ordem_id?: string | null
          ponto_id?: string | null
          posicao?: number
          produto?: string | null
          quantidade?: number
          reagendamentos?: number
          servico?: string
          setor?: string
          status?: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programacao_servicos_cadastro_id_fkey"
            columns: ["cadastro_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "producao_equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "producao_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_ponto_id_fkey"
            columns: ["ponto_id"]
            isOneToOne: false
            referencedRelation: "pontos_midia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "producao_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      programacao_servicos_ajudantes: {
        Row: {
          colaborador_id: string
          servico_id: string
        }
        Insert: {
          colaborador_id: string
          servico_id: string
        }
        Update: {
          colaborador_id?: string
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programacao_servicos_ajudantes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "producao_colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacao_servicos_ajudantes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "programacao_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_midia: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cadastro_id: string
          condicoes_pagamento: string | null
          created_at: string
          created_by: string | null
          desconto: number
          empresa_id: string
          id: string
          numero: number | null
          observacao: string | null
          proposta_id: string | null
          status: string
          tipo: string
          updated_at: string
          validade: string | null
          vendedor: string | null
        }
        Insert: {
          cadastro_id: string
          condicoes_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          desconto?: number
          empresa_id: string
          id?: string
          numero?: number | null
          observacao?: string | null
          proposta_id?: string | null
          status: string
          tipo: string
          updated_at?: string
          validade?: string | null
          vendedor?: string | null
        }
        Update: {
          cadastro_id?: string
          condicoes_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          desconto?: number
          empresa_id?: string
          id?: string
          numero?: number | null
          observacao?: string | null
          proposta_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          validade?: string | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cadastro_id_fkey"
            columns: ["cadastro_id"]
            isOneToOne: false
            referencedRelation: "cadastros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_itens: {
        Row: {
          categoria: string
          desconto: number
          descricao: string
          id: string
          ordem: number
          periodo_fim: string | null
          periodo_inicio: string | null
          ponto: string | null
          quantidade: number
          valor_unitario: number
          venda_id: string
        }
        Insert: {
          categoria: string
          desconto?: number
          descricao: string
          id?: string
          ordem?: number
          periodo_fim?: string | null
          periodo_inicio?: string | null
          ponto?: string | null
          quantidade?: number
          valor_unitario?: number
          venda_id: string
        }
        Update: {
          categoria?: string
          desconto?: number
          descricao?: string
          id?: string
          ordem?: number
          periodo_fim?: string | null
          periodo_inicio?: string | null
          ponto?: string | null
          quantidade?: number
          valor_unitario?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atribuir_vendedor: {
        Args: { filtros?: Json; ids?: string[]; vendedor_novo: string }
        Returns: number
      }
      atualizar_etapa_producao: {
        Args: { concluida: boolean; etapa_uuid: string }
        Returns: undefined
      }
      cadastro_corresponde: {
        Args: {
          c: Database["public"]["Tables"]["cadastros"]["Row"]
          filtros: Json
        }
        Returns: boolean
      }
      converter_proposta: { Args: { proposta_uuid: string }; Returns: string }
      criar_servico_producao: {
        Args: { p_nome: string; p_produto?: string }
        Returns: string
      }
      excluir_item_catalogo_programacao: {
        Args: { p_id: string; p_tipo: string }
        Returns: string
      }
      excluir_planejamento: {
        Args: { agendamento_uuid: string }
        Returns: undefined
      }
      excluir_veiculo: { Args: { p_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      importar_cadastros: { Args: { linhas: Json }; Returns: Json }
      importar_historico_comercial_sige: {
        Args: { linhas: Json }
        Returns: Json
      }
      is_membro: { Args: { _user_id: string }; Returns: boolean }
      listar_cadastros: {
        Args: { filtros?: Json; pagina?: number }
        Returns: Json
      }
      reagendar_programacao: {
        Args: {
          nova_data: string
          nova_equipe?: string
          novo_lider?: string
          novo_veiculo?: string
          servico_uuid: string
        }
        Returns: undefined
      }
      salvar_cadastro: {
        Args: { cadastro_uuid?: string; dados: Json }
        Returns: string
      }
      salvar_equipe_producao: {
        Args: { dados: Json; equipe_uuid?: string }
        Returns: string
      }
      salvar_ordem_producao: {
        Args: { dados: Json; ordem_uuid?: string }
        Returns: string
      }
      salvar_planejamento: {
        Args: { agendamento_uuid?: string; dados: Json }
        Returns: string
      }
      salvar_programacao_lote: {
        Args: { excluir?: string[]; linhas: Json }
        Returns: number
      }
      salvar_venda: {
        Args: { dados: Json; venda_uuid?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
