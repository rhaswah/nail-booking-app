import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lume Nail Studio",
    short_name: "Lume",
    description:
      "Book manicures, pedicures, gel, and nail extensions at Lume Nail Studio.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2", // cream
    theme_color: "#ce6b69", // blush-500
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
