import { createFileRoute } from "@tanstack/react-router";
import { LockedScreen } from "@/components/LockedScreen";

export const Route = createFileRoute("/_authenticated/balcao")({
  head: () => ({
    meta: [
      { title: "Balcão — PattyOne" },
      { name: "description", content: "Módulo Balcão do PattyOne." },
      { property: "og:title", content: "Balcão — PattyOne" },
      { property: "og:description", content: "Módulo Balcão do PattyOne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LockedScreen,
});
