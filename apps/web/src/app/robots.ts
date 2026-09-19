import type { MetadataRoute } from "next";
import { site } from "@/lib/marketing/site";

/**
 * Crawlers: the landing (root and `/inicio`), the auth entry points and — when published — the
 * interim legal notices are indexable. Application routes redirect to login without a session,
 * the Compliance Room is `noindex` + `no-store` (D36) and the BFF is JSON: none of them belongs
 * in an index, so they are disallowed here as well.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/inicio", "/entrar", "/criar-conta"],
        disallow: [
          "/api/",
          "/sala/",
          "/sala",
          "/configuracoes",
          "/diagnostico",
          "/riscos",
          "/acoes",
          "/controles",
          "/documentos",
          "/historico",
          "/resumo",
          "/convite",
          "/recuperar-senha",
          "/redefinir-senha",
        ],
      },
    ],
    sitemap: `${site.siteUrl}/sitemap.xml`,
  };
}
