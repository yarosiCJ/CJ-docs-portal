import React, { useEffect } from "react";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";

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
    };

    markRedocDecorations();
    const observer = new MutationObserver(markRedocDecorations);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="redocPage"
      style={{
        height: "calc(100vh - var(--ifm-navbar-height))",
        overflow: "auto",
        background: isDark ? "#111111" : "#ffffff",
      }}>
      <BrowserOnly fallback={<div style={{ padding: 16 }}>Loading API reference…</div>}>
        {() => {
          // redoc expects browser globals; don't SSR it
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { RedocStandalone } = require("redoc");
          return (
            <RedocStandalone
              specUrl={specUrl}
              options={{
                scrollYOffset: 60,
                requiredPropsFirst: true,
                theme: {
                  colors: {
                    primary: {
                      main: isDark ? "#62dcf7" : "#111111",
                    },
                    text: {
                      primary: isDark ? "#fafafa" : "#111111",
                      secondary: isDark ? "#dadada" : "#4c4c4c",
                    },
                    border: {
                      dark: isDark ? "rgba(250, 250, 250, 0.25)" : "rgba(17, 17, 17, 0.2)",
                      light: isDark ? "rgba(250, 250, 250, 0.12)" : "rgba(17, 17, 17, 0.08)",
                    },
                  },
                  sidebar: {
                    backgroundColor: isDark ? "#111111" : "#fafafa",
                    textColor: isDark ? "#dadada" : "#4c4c4c",
                    activeTextColor: isDark ? "#ffffff" : "#111111",
                  },
                  rightPanel: {
                    backgroundColor: isDark ? "#1d1d1d" : "#fafafa",
                    textColor: isDark ? "#fafafa" : "#111111",
                  },
                  typography: {
                    fontFamily: "Figtree, Arial, sans-serif",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    headings: {
                      fontFamily: "Figtree, Arial, sans-serif",
                    },
                    code: {
                      color: isDark ? "#fafafa" : "#111111",
                      backgroundColor: isDark ? "#2e2e2e" : "#f5f5f5",
                    },
                  },
                  schema: {
                    defaultDetailsWidth: "75%",
                    nestedBackground: isDark ? "#161616" : "#ffffff",
                    linesColor: isDark ? "rgba(250, 250, 250, 0.18)" : "rgba(17, 17, 17, 0.16)",
                    typeNameColor: isDark ? "#fafafa" : "#111111",
                    typeTitleColor: isDark ? "#fafafa" : "#111111",
                    requireLabelColor: isDark ? "#f77e62" : "#c64eb0",
                    labelsTextSize: "13px",
                    nestingSpacing: "1.15em",
                  },
                },
              }}
            />
          );
        }}
      </BrowserOnly>
    </div>
  );
}

