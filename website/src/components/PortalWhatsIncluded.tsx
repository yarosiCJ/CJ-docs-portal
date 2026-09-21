import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {usePortalFeatures} from '@site/src/portalFeatures';

export function PortalWhatsIncluded(): ReactNode {
  const features = usePortalFeatures();

  return (
    <ul>
      <li>
        <strong>API Reference</strong>: <Link to="/reference">/reference</Link> (renders{' '}
        <code>openapi.yaml</code> via Redoc)
      </li>
      <li>
        <strong>OpenAPI file</strong>:{' '}
        <a href={useBaseUrl('/openapi/openapi.yaml')}>/openapi/openapi.yaml</a>
      </li>
      {features.postman ? (
        <li>
          <strong>Postman</strong>: <Link to="/docs/postman">collection page</Link>
        </li>
      ) : null}
      <li>
        <strong>Additional parameter descriptions</strong>: <code>Docs → Reference → CoP</code>{' '}
        (synced from contract sources)
      </li>
      {features.integration ? (
        <li>
          <strong>Integration scenarios</strong>: <code>Docs → Integration</code> (synced from
          integration sources)
        </li>
      ) : null}
    </ul>
  );
}

export function PortalPublishedArtifacts(): ReactNode {
  const features = usePortalFeatures();

  return (
    <ul>
      <li>
        OpenAPI spec at <a href={useBaseUrl('/openapi/openapi.yaml')}>/openapi/openapi.yaml</a>
      </li>
      {features.postman ? (
        <li>
          Postman collection at{' '}
          <a href={useBaseUrl('/postman/Clear_Junction_API.postman_collection.json')}>
            /postman/Clear_Junction_API.postman_collection.json
          </a>
        </li>
      ) : null}
      <li>
        Additional parameter descriptions under <Link to="/docs/reference">Docs → Reference</Link>
      </li>
      {features.integration ? (
        <li>Integration guides and scenarios under Docs → Integration</li>
      ) : null}
    </ul>
  );
}
