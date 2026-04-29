import React from "react";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";

export default function Reference(): JSX.Element {
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
                specUrl="/openapi/openapi.yaml"
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

