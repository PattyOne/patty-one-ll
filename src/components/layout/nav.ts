import {
  BarChart3, MapPin, Factory, Store, Wallet, PackageSearch, Briefcase,
  LayoutGrid, Gauge, Target, FileBarChart, UsersRound, Settings, Upload, type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon; adminOnly?: boolean };

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Operação",
    items: [
      { label: "Comercial", to: "/comercial", icon: BarChart3 },
      { label: "Mídia OOH", to: "/midia-ooh", icon: MapPin },
      { label: "Produção", to: "/producao", icon: Factory },
      { label: "Balcão", to: "/balcao", icon: Store },
      { label: "Financeiro", to: "/financeiro", icon: Wallet },
      { label: "Compras e Estoque", to: "/estoque", icon: PackageSearch },
      { label: "Administrativo", to: "/administrativo", icon: Briefcase },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
      { label: "Painel de Gestão", to: "/painel-gestao", icon: Gauge },
      { label: "Planejamento", to: "/planejamento", icon: Target },
      { label: "Relatórios", to: "/relatorios", icon: FileBarChart },
      { label: "Importar dados", to: "/importar", icon: Upload, adminOnly: true },
    ],
  },
];

export const footerItems: NavItem[] = [
  { label: "Cadastros", to: "/cadastros", icon: UsersRound },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
];

export const allNavItems = [...navGroups.flatMap((g) => g.items), ...footerItems];
