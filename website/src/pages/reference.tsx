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

/** iPhone / iPod / iPad (incl. iPadOS desktop UA). Used for WebKit zoom crash mitigations. */
function isAppleTouchWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iP(hone|od|ad)/.test(ua)) return true;
  // iPadOS 13+ may report as MacIntel with touch
  return navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
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
  const [iosLite, setIosLite] = useState(false);

  useEffect(() => {
    setIosLite(isAppleTouchWebKit());
  }, []);

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
    const schemaClass = useSchemaOverrides ? "redoc-schema-overrides" : "redoc-schema-base";
    return `redocPage ${schemaClass}${iosLite ? " redoc-ios-lite" : ""}`;
  }, [useSchemaOverrides, iosLite]);

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

    const rewriteDiagramSources = () => {
      root.querySelectorAll<HTMLImageElement>("img[src*='/docs/diagrams/out/'], img[src*='docs/diagrams/out/']").forEach((img) => {
        const currentSrc = img.getAttribute("src") ?? "";
        const diagramMatch = currentSrc.match(
          /(?:^|\/)docs\/diagrams\/out\/([^/?#]+?)(?:-(?:dark|light))?\.svg([?#].*)?$/i,
        );
        if (!diagramMatch) return;

        const [, diagramName, suffix = ""] = diagramMatch;
        const nextSrc = `${diagramsBaseUrl}${diagramName}-${isDark ? "dark" : "light"}.svg${suffix}`;
        if (img.getAttribute("src") !== nextSrc) {
          img.src = nextSrc;
        }
        img.loading = "lazy";
        img.decoding = "async";
      });
    };

    if (iosLite) {
      root.setAttribute("data-cj-ios-lite", "1");
      document.documentElement.setAttribute("data-cj-ios-lite", "1");

      const neutralizeStickyLayers = () => {
        root.querySelectorAll("*").forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const position = getComputedStyle(node).position;
          if (position === "sticky" || position === "-webkit-sticky") {
            node.style.setProperty("position", "static", "important");
          }
        });
      };

      // Relative markdown paths like docs/diagrams/out/x.svg resolve under /reference/
      // → 404 (blue "?" on iOS). Fix URLs without running the heavy decoration observer.
      let diagramTimer: ReturnType<typeof setTimeout> | undefined;
      const scheduleDiagramRewrite = () => {
        if (diagramTimer !== undefined) clearTimeout(diagramTimer);
        diagramTimer = setTimeout(() => {
          diagramTimer = undefined;
          rewriteDiagramSources();
        }, 100);
      };

      const diagramObserver = new MutationObserver(scheduleDiagramRewrite);
      rewriteDiagramSources();
      diagramObserver.observe(root, { childList: true, subtree: true });

      const logLite = () => {
        neutralizeStickyLayers();
        rewriteDiagramSources();
        const broken = Array.from(root.querySelectorAll("img[src*='diagrams']")).filter(
          (img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth === 0,
        ).length;
        console.info("[CJ] redoc ios-lite", {
          nodes: document.getElementsByTagName("*").length,
          fieldCells: document.querySelectorAll("td[kind='field']").length,
          images: document.querySelectorAll("img").length,
          diagramBroken: broken,
          stickyNeutralized: true,
          ua: navigator.userAgent,
        });
      };
      const readyTimer = window.setTimeout(logLite, 2500);
      const lateStickyTimer = window.setTimeout(neutralizeStickyLayers, 6000);
      return () => {
        if (diagramTimer !== undefined) clearTimeout(diagramTimer);
        diagramObserver.disconnect();
        window.clearTimeout(readyTimer);
        window.clearTimeout(lateStickyTimer);
        root.removeAttribute("data-cj-ios-lite");
        document.documentElement.removeAttribute("data-cj-ios-lite");
      };
    }

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let rafId: number | undefined;
    let observer: MutationObserver;

    const observeOptions: MutationObserverInit = { childList: true, subtree: true };

    const markRedocDecorations = () => {
      observer.disconnect();
      try {
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

        rewriteDiagramSources();
      } finally {
        observer.observe(root, observeOptions);
      }
    };

    const scheduleMarkRedocDecorations = () => {
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        rafId = requestAnimationFrame(() => {
          rafId = undefined;
          markRedocDecorations();
        });
      }, 120);
    };

    observer = new MutationObserver(scheduleMarkRedocDecorations);
    markRedocDecorations();
    observer.observe(root, observeOptions);

    return () => {
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [diagramsBaseUrl, isDark, iosLite]);

  const redocOptions = useMemo(() => {
    const liteOptions = iosLite
      ? {
          // Fewer expanded sample/schema layers → smaller DOM under pinch-zoom.
          // Keep request samples and diagrams visible (hideRequestPayloadSample / CSS hide removed after UX feedback).
          jsonSampleExpandLevel: 1,
          jsonSamplesExpandLevel: 1,
          schemaExpansionLevel: 0,
          schemasExpansionLevel: 0,
          generatedPayloadSamplesMaxDepth: 2,
          generatedSamplesMaxDepth: 2,
          expandResponses: "",
          pathInMiddlePanel: true,
        }
      : {};

    return {
      // Top-level document scroll (no nested 100vh/overflow shell):
      // nested scroll + sticky Redoc layers crash WebKit on iOS pinch-zoom.
      scrollYOffset: 60,
      nativeScrollbars: true,
      requiredPropsFirst: true,
      hideSchemaTitles: true,
      ...liteOptions,
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
    };
  }, [brand.accent, brand.bg, brand.borderSoft, brand.borderStrong, brand.codeBg, brand.muted, brand.required, brand.surface, brand.surfaceAlt, brand.text, iosLite, useSchemaOverrides]);

  return (
    <div className={redocPageClassName} style={{ background: brand.bg }}>
      <BrowserOnly fallback={<div style={{ padding: 16 }}>Loading API reference…</div>}>
        {() => {
          // redoc expects browser globals; don't SSR it
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { RedocStandalone } = require("redoc");
          return (
            <RedocStandalone
              key={`${useSchemaOverrides ? "schema-overrides" : "schema-base"}-${iosLite ? "ios-lite" : "full"}`}
              specUrl={specUrl}
              options={redocOptions}
            />
          );
        }}
      </BrowserOnly>
    </div>
  );
}
