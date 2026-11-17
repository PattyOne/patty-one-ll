import { createFileRoute } from "@tanstack/react-router";
import { LockedScreen } from "@/components/LockedScreen";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Compras e Estoque — PattyOne" },
      { name: "description", content: "Módulo Compras e Estoque do PattyOne." },
      { property: "og:title", content: "Compras e Estoque — PattyOne" },
      { property: "og:description", content: "Módulo Compras e Estoque do PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockedScreen,
});
