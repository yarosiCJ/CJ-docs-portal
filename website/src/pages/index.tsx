import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import {usePortalFeatures} from '@site/src/portalFeatures';

import styles from './index.module.css';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const features = usePortalFeatures();
  return (
    <Layout
      title={siteConfig.title}
      description="Clear Junction API documentation portal: OpenAPI reference and guides.">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <div className={styles.kicker}>Clear Junction</div>
              <h1 className={styles.title}>API Documentation Portal</h1>
              <p className={styles.subtitle}>
                OpenAPI reference and supporting documentation for integrating with the Clear
                Junction API.
              </p>

              <div className={styles.ctas}>
                <Link className={styles.primaryCta} to="/reference">
                  Open API Reference
                </Link>
                <Link className={styles.secondaryCta} to="/docs/intro">
                  Getting started
                </Link>
              </div>

              <div className={styles.quickLinks}>
                <Link to="/docs/intro">Docs</Link>
                <span className={styles.dot} />
                <Link to="/docs/reference">Additional reference</Link>
                {features.integration ? (
                  <>
                    <span className={styles.dot} />
                    <Link to="/docs/integration">Integration</Link>
                  </>
                ) : null}
                {features.postman ? (
                  <>
                    <span className={styles.dot} />
                    <Link to="/docs/postman">Postman</Link>
                  </>
                ) : null}
              </div>
            </div>

            <div className={styles.heroRight} aria-hidden="true">
              <div className={styles.heroCard}>
                <div className={styles.heroCardHeader}>
                  <span className={styles.pill}>Live</span>
                  <span className={styles.heroCardTitle}>Contract</span>
                </div>
                <div className={styles.heroCardBody}>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>OpenAPI</div>
                    <div className={styles.metricValue}>Bundled</div>
                  </div>
                  {features.postman ? (
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>Postman</div>
                      <div className={styles.metricValue}>Sandbox</div>
                    </div>
                  ) : null}
                  {features.integration ? (
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>Scenarios</div>
                      <div className={styles.metricValue}>Playbooks</div>
                    </div>
                  ) : (
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>Docs</div>
                      <div className={styles.metricValue}>Guides</div>
                    </div>
                  )}
                </div>
                <div className={styles.heroCardFooter}>
                  <div className={styles.miniHint}>Use the navigation above to browse docs.</div>
                </div>
              </div>
              <div className={styles.glow} />
            </div>
          </div>
        </section>

        <section className={styles.sections}>
          <div className={styles.sectionGrid}>
            <Link className={styles.sectionCard} to="/reference">
              <div className={styles.sectionTitle}>API Reference</div>
              <div className={styles.sectionText}>
                Browse endpoints, schemas, and examples rendered from the bundled OpenAPI contract.
              </div>
              <div className={styles.sectionArrow}>→</div>
            </Link>
            <Link className={styles.sectionCard} to="/docs/intro">
              <div className={styles.sectionTitle}>Documentation</div>
              <div className={styles.sectionText}>
                Start here for the portal overview, OpenAPI files, and additional parameter
                descriptions.
              </div>
              <div className={styles.sectionArrow}>→</div>
            </Link>
            {features.postman ? (
              <Link className={styles.sectionCard} to="/docs/postman">
                <div className={styles.sectionTitle}>Postman</div>
                <div className={styles.sectionText}>
                  Download the collection and run common flows quickly in the Sandbox environment.
                </div>
                <div className={styles.sectionArrow}>→</div>
              </Link>
            ) : null}
            {features.integration ? (
              <Link className={styles.sectionCard} to="/docs/integration/scenarios">
                <div className={styles.sectionTitle}>Integration scenarios</div>
                <div className={styles.sectionText}>
                  Step-by-step playbooks and scenario documents synced from the scenarios
                  repository.
                </div>
                <div className={styles.sectionArrow}>→</div>
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </Layout>
  );
}
