import { createFileRoute } from "@tanstack/react-router";
import { LockedScreen } from "@/components/LockedScreen";

export const Route = createFileRoute("/_authenticated/painel-gestao")({
  head: () => ({
    meta: [
      { title: "Painel de Gestão — PattyOne" },
      { name: "description", content: "Módulo Painel de Gestão do PattyOne." },
      { property: "og:title", content: "Painel de Gestão — PattyOne" },
      { property: "og:description", content: "Módulo Painel de Gestão do PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockedScreen,
});
