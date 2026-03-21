import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/calculator"],
        disallow: ["/geckos/", "/calendar", "/incubator"],
      },
    ],
    sitemap: "https://geckohub.vercel.app/sitemap.xml",
  };
}
