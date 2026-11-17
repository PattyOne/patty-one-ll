import { createFileRoute } from "@tanstack/react-router";
import { LockedScreen } from "@/components/LockedScreen";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — PattyOne" },
      { name: "description", content: "Módulo Relatórios do PattyOne." },
      { property: "og:title", content: "Relatórios — PattyOne" },
      { property: "og:description", content: "Módulo Relatórios do PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockedScreen,
});
