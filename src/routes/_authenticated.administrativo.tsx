import { createFileRoute } from "@tanstack/react-router";
import { LockedScreen } from "@/components/LockedScreen";

export const Route = createFileRoute("/_authenticated/administrativo")({
  head: () => ({
    meta: [
      { title: "Administrativo — PattyOne" },
      { name: "description", content: "Módulo Administrativo do PattyOne." },
      { property: "og:title", content: "Administrativo — PattyOne" },
      { property: "og:description", content: "Módulo Administrativo do PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockedScreen,
});
