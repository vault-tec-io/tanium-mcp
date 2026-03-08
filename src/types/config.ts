export interface Config {
  baseUrl: string;
  apiToken: string;
  tlsCaBundle?: string;
  tlsVerify: boolean;
  cacheTtlSeconds: number;
  cacheDiskPath?: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;

  // Derived URLs
  graphqlUrl: string;
  platformRestUrl: string;
  patchRestUrl: string;
  deployRestUrl: string;
  connectRestUrl: string;
  complyRestUrl: string;
  assetRestUrl: string;
}
