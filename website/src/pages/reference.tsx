import React, { useEffect, useMemo, useState } from "react";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";

function shouldUseSchemaOverridesFromLocation(): boolean {
  if (typeof window === "undefined") return true;

  const searchParams = new URLSearchParams(window.location.search);
  const schemaFromSearch = searchParams.get("schema");
  if (schemaFromSearch) return schemaFromSearch !== "base";

  // Also support params placed after the hash, e.g. `#tag/foo?schema=base`
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex !== -1) {
    const hashParams = new URLSearchParams(hash.slice(qIndex + 1));
    const schemaFromHash = hashParams.get("schema");
    if (schemaFromHash) return schemaFromHash !== "base";
  }

  return true;
}

export default function Reference(): React.ReactElement {
  const specUrl = useBaseUrl("/openapi/openapi.yaml");

  return (
    <Layout title="API Reference" noFooter>
      <ReferenceContent specUrl={specUrl} />
    </Layout>
  );
}

function ReferenceContent({ specUrl }: { specUrl: string }): React.ReactElement {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const diagramsBaseUrl = useBaseUrl("/docs/diagrams/out/");
  const [useSchemaOverrides, setUseSchemaOverrides] = useState<boolean>(() =>
    shouldUseSchemaOverridesFromLocation(),
  );

  useEffect(() => {
    const update = () => setUseSchemaOverrides(shouldUseSchemaOverridesFromLocation());
    update();
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  const redocPageClassName = useMemo(() => {
    return `redocPage ${useSchemaOverrides ? "redoc-schema-overrides" : "redoc-schema-base"}`;
  }, [useSchemaOverrides]);

  const brand = {
    bg: isDark ? "#111111" : "#fafafa",
    surface: isDark ? "#1d1d1d" : "#ffffff",
    surfaceAlt: isDark ? "#161616" : "#fafafa",
    text: isDark ? "#fafafa" : "#111111",
    muted: isDark ? "#dadada" : "#4c4c4c",
    borderStrong: isDark ? "rgba(250, 250, 250, 0.25)" : "rgba(17, 17, 17, 0.2)",
    borderSoft: isDark ? "rgba(250, 250, 250, 0.12)" : "rgba(17, 17, 17, 0.08)",
    accent: "#62dcf7",
    codeBg: isDark ? "#2e2e2e" : "#ffffff",
    required: isDark ? "#f77e62" : "#c64eb0",
  };

  useEffect(() => {
    const root = document.querySelector(".redocPage");
    if (!root) return;

    const markRedocDecorations = () => {
      root.querySelectorAll(".redoc-json .token.string").forEach((token) => {
        const tokenText = token.textContent?.replace(/^"|"$/g, "") ?? "";
        token.classList.toggle("json-url-value", /^https?:\/\//.test(tokenText));
      });

      root.querySelectorAll<HTMLAnchorElement>(".redoc-json a[href^='http']").forEach((link) => {
        link.classList.add("json-url-value");

        const previous = link.previousElementSibling;
        const next = link.nextElementSibling;
        previous?.classList.toggle(
          "json-url-value",
          previous.classList.contains("token") && previous.textContent === '"',
        );
        next?.classList.toggle(
          "json-url-value",
          next.classList.contains("token") && next.textContent === '"',
        );
      });

      root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
        const isUtilityLink = Boolean(
          link.closest(".redoc-json, pre, code, [role='tab'], button") ||
            Array.from(link.classList).some((className) => /copy|expand|collapse/i.test(className)),
        );
        link.classList.toggle("redoc-description-link", !isUtilityLink);
      });

      root.querySelectorAll("table span, table div, table small").forEach((element) => {
        const text = element.textContent?.trim().toLowerCase();
        element.classList.toggle("redoc-required-label", text === "required");
        element.classList.toggle("redoc-schema-constraint", text === "non-empty");
      });

      root.querySelectorAll("button, [role='tab']").forEach((element) => {
        const text = element.textContent?.trim() ?? "";
        const className = element.getAttribute("class") ?? "";
        element.classList.toggle("redoc-status-success", /^2\d\d\b/.test(text) || className.includes("tab-success"));
        element.classList.toggle("redoc-status-error", /^[45]\d\d\b/.test(text) || className.includes("tab-error"));
      });

      root.querySelectorAll("h5").forEach((heading) => {
        if (heading.textContent?.trim() !== "Authorizations:") return;

        const authHeaderColumn = heading.parentElement;
        const authWrap = authHeaderColumn?.parentElement;
        authWrap?.classList.add("redoc-auth-wrap");
        authHeaderColumn?.classList.add("redoc-auth-header-column");
        authWrap?.querySelectorAll(":scope > div").forEach((column) => {
          if (column !== authHeaderColumn) column.classList.add("redoc-auth-securities-column");
        });
      });

      root.querySelectorAll<HTMLImageElement>("img[src*='/docs/diagrams/out/'], img[src*='docs/diagrams/out/']").forEach((img) => {
        const currentSrc = img.getAttribute("src") ?? "";
        const diagramMatch = currentSrc.match(/(?:^|\/)docs\/diagrams\/out\/([^/?#]+?)(?:-(?:dark|light))?\.svg([?#].*)?$/i);
        if (!diagramMatch) return;

        const [, diagramName, suffix = ""] = diagramMatch;
        const nextSrc = `${diagramsBaseUrl}${diagramName}-${isDark ? "dark" : "light"}.svg${suffix}`;
        if (img.getAttribute("src") !== nextSrc) {
          img.src = nextSrc;
        }
      });
    };

    markRedocDecorations();
    const observer = new MutationObserver(markRedocDecorations);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [diagramsBaseUrl, isDark]);

  return (
    <div
      className={redocPageClassName}
      style={{
        height: "calc(100vh - var(--ifm-navbar-height))",
        overflow: "auto",
        background: brand.bg,
      }}>
      <BrowserOnly fallback={<div style={{ padding: 16 }}>Loading API reference…</div>}>
        {() => {
          // redoc expects browser globals; don't SSR it
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { RedocStandalone } = require("redoc");
          return (
            <RedocStandalone
              key={useSchemaOverrides ? "schema-overrides" : "schema-base"}
              specUrl={specUrl}
              options={{
                scrollYOffset: 60,
                requiredPropsFirst: true,
                hideSchemaTitles: true,
                theme: {
                  colors: {
                    primary: {
                      main: brand.accent,
                    },
                    text: {
                      primary: brand.text,
                      secondary: brand.muted,
                    },
                    border: {
                      dark: brand.borderStrong,
                      light: brand.borderSoft,
                    },
                  },
                  sidebar: {
                    backgroundColor: brand.bg,
                    textColor: brand.muted,
                    activeTextColor: brand.text,
                  },
                  rightPanel: {
                    backgroundColor: brand.surface,
                    textColor: brand.text,
                  },
                  typography: {
                    fontFamily: "Figtree, Arial, sans-serif",
                    fontSize: "16px",
                    lineHeight: "1.5",
                    fontWeightRegular: "400",
                    fontWeightBold: "700",
                    fontWeightLight: "300",
                    headings: {
                      fontFamily: "Figtree, Arial, sans-serif",
                      fontWeight: "700",
                      lineHeight: "1.1",
                    },
                    code: {
                      color: brand.text,
                      backgroundColor: brand.codeBg,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    },
                  },
                  ...(useSchemaOverrides
                    ? {
                        schema: {
                          defaultDetailsWidth: "75%",
                          nestedBackground: brand.surfaceAlt,
                          linesColor: brand.borderStrong,
                          typeNameColor: brand.text,
                          typeTitleColor: brand.text,
                          requireLabelColor: brand.required,
                          labelsTextSize: "13px",
                          nestingSpacing: "1.15em",
                        },
                      }
                    : {}),
                },
              }}
            />
          );
        }}
      </BrowserOnly>
    </div>
  );
}
