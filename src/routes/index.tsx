import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PattyOne — Gestão de Mídia e Comunicação Visual" },
      { name: "description", content: "ERP para comunicação visual e mídia externa (OOH)." },
      { property: "og:title", content: "PattyOne — Gestão de Mídia e Comunicação Visual" },
      { property: "og:description", content: "ERP para comunicação visual e mídia externa (OOH)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
