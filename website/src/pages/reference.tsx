import React from "react";
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

  return (
    <div
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
                    backgroundColor: isDark ? "#1d1d1d" : "#111111",
                    textColor: "#fafafa",
                  },
                  typography: {
                    fontFamily: "Figtree, Arial, sans-serif",
                    headings: {
                      fontFamily: "Figtree, Arial, sans-serif",
                    },
                    code: {
                      color: isDark ? "#fafafa" : "#111111",
                      backgroundColor: isDark ? "#2e2e2e" : "#f5f5f5",
                    },
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

