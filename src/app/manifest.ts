import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "People's First Movement",
    short_name: "PFM",
    description: "The operating workspace for People's First Movement.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7faf8",
    theme_color: "#183b35",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
