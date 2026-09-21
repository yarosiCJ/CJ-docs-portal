export type PortalFeatures = {
  docs: boolean;
  postman: boolean;
  integration: boolean;
};

export function loadPortalFeatures(): PortalFeatures;
