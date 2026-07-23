import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fairy Nail Spa",
    short_name: "Fairy Nails",
    description:
      "Book manicures, pedicures, gel, and dreamy nail art at Fairy Nail Spa. ✨",
    start_url: "/",
    display: "standalone",
    background_color: "#fff5fa", // pink-cream
    theme_color: "#f24e97", // pink-500
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
