import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export type PortalFeatures = {
  docs: boolean;
  postman: boolean;
  integration: boolean;
};

export function usePortalFeatures(): PortalFeatures {
  const {siteConfig} = useDocusaurusContext();
  const features = siteConfig.customFields?.features as PortalFeatures | undefined;
  return {
    docs: Boolean(features?.docs),
    postman: Boolean(features?.postman),
    integration: Boolean(features?.integration),
  };
}
