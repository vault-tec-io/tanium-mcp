export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: PageInfo;
  totalRecords?: number;
}

export interface SystemError {
  message: string;
  retryable: boolean;
  timedOut: boolean;
}

export interface Principal {
  id: string;
  name: string;
}

export interface Persona {
  id: string;
  name: string;
}

export interface APIToken {
  id: string;
  created: string;
  expiration: string;
  lastUsed: string;
  notes: string;
  persona?: Persona;
  tokenString?: string;
  trustedIPAddresses: string[];
}

// Sensors
export interface SensorParameter {
  name: string;
  type: string;
  description?: string;
  defaultValue?: string;
  label?: string;
}

export interface SensorColumn {
  name: string;
  valueType: string;
}

export interface Sensor {
  name: string;
  description?: string;
  category?: string;
  contentSetName?: string;
  parameters: SensorParameter[];
  columns?: SensorColumn[];
  harvested?: boolean;
  hidden?: boolean;
}

export interface CachedSensor extends Sensor {
  id: string;
  hash?: number;
}

// Packages
export interface PackageParam {
  name: string;
  description?: string;
  defaultValue?: string;
  label?: string;
}

export interface PackageSpec {
  name: string;
  command?: string;
  contentSetName?: string;
  params?: PackageParam[];
  commandTimeoutSeconds?: number;
  expireSeconds?: number;
}

export interface CachedPackage extends PackageSpec {
  id: string;
  description?: string;
}

// Actions
export interface ActionResults {
  completed: number;
  running: number;
  waiting: number;
  downloading: number;
  failed: number;
  expired: number;
  failedVerification: number;
  pendingVerification: number;
  verified: number;
  other: number;
  expected: number;
}

export interface ActionTargets {
  actionGroup?: { name: string; id: string };
  targetGroup?: { name: string; id: string };
}

export interface Action {
  id: string;
  name: string;
  comment: string;
  creationTime?: string;
  expirationTime?: string;
  startTime?: string;
  expireSeconds?: number;
  distributeSeconds?: number;
  status?: string;
  stopped: boolean;
  stoppedFlag?: boolean;
  creator: Principal;
  approver?: Principal;
  package: { name: string; id?: string };
  results: ActionResults;
  targets: ActionTargets;
}

export interface ScheduledAction {
  id: string;
  name: string;
  comment?: string;
  status: string;
  creator?: Principal;
  approver?: Principal;
  package?: { name: string };
  targets?: ActionTargets;
}

// Computer Groups
export interface ComputerGroup {
  id: string;
  name: string;
  text?: string;
  type?: string;
  computerCount?: number;
}

// Action Groups
export interface ActionGroup {
  id: string;
  name: string;
  any: boolean;
  computerGroups: Array<{ id: string; name: string }>;
}

// Endpoints
export interface EndpointTag {
  name: string;
}

export interface Endpoint {
  id: string;
  computerName?: string;
  ipAddress?: string;
  macAddress?: string;
  os?: { platform?: string; name?: string; generation?: string };
  lastSeen?: string;
  status?: string;
  tags?: EndpointTag[];
}

// Patch
export interface PatchDefinition {
  id: string;
  title: string;
  severity?: string;
  releaseDate?: string;
  platform?: string;
}

// Deploy / Software
export interface SoftwarePackage {
  id: string;
  name: string;
  description?: string;
  vendor?: string;
  productVersion?: string;
}

export interface SoftwareDeployment {
  id: string;
  name: string;
  status: string;
  completedCount?: number;
  failedCount?: number;
  pendingCount?: number;
}

// Reports
export interface Report {
  id: string;
  name: string;
  description?: string;
  author?: Principal;
  createdAt?: string;
  updatedAt?: string;
}

// Playbooks
export interface Playbook {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export interface PlaybookRun {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
}

// Asset products
export interface AssetProduct {
  name: string;
  vendor?: string;
  version?: string;
  installedCount?: number;
  usedCount?: number;
}
