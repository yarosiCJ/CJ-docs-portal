import React from "react";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function Reference(): JSX.Element {
  const specUrl = useBaseUrl("/openapi/openapi.yaml");

  return (
    <Layout title="API Reference">
      <div style={{ height: "calc(100vh - 60px)" }}>
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
                }}
              />
            );
          }}
        </BrowserOnly>
      </div>
    </Layout>
  );
}

