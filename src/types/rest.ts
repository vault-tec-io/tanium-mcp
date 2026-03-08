// Platform REST types (/api/v2)

export interface PlatformSensor {
  id: number;
  name: string;
  description?: string;
  category?: string;
  hash?: number;
  content_set?: { name: string };
  parameters?: Array<{
    name: string;
    type: string;
    label?: string;
    default_value?: string;
  }>;
}

export interface PlatformPackage {
  id: number;
  name: string;
  command?: string;
  description?: string;
  command_timeout?: number;
  expire_seconds?: number;
  content_set?: { name: string };
  params?: Array<{
    name: string;
    label?: string;
    default_value?: string;
  }>;
}

export interface PlatformListResponse<T> {
  data: {
    result_object: {
      [key: string]: T[] | T;
    };
  };
}

export interface QuestionResultInfo {
  question_id: number;
  mr_passed: number;
  mr_tested: number;
  estimated_total: number;
  passed_flag: number;
  expire_seconds: number;
  id: number;
}

export interface QuestionResultData {
  result_sets: Array<{
    age: number;
    id: number;
    report_count: number;
    saved_question_id: number;
    question_id: number;
    columns: Array<{ name: string; what_hash: number }>;
    rows: Array<{ data: Array<Array<{ text: string }>> }>;
  }>;
}

// Patch REST types (/plugin/products/patch)

export interface PatchDeployment {
  id: string;
  name: string;
  status: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  targetGroup?: string;
  deployedCount?: number;
  failedCount?: number;
  pendingCount?: number;
}

export interface PatchList {
  id: string;
  name: string;
  description?: string;
  patchCount?: number;
}

export interface PatchScanConfig {
  id: string;
  name: string;
  platforms?: string[];
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  start?: string;
  end?: string;
  schedule?: string;
}

export interface PatchBlocklist {
  id: string;
  name?: string;
  patches?: string[];
}

export interface PatchRepo {
  id: string;
  name: string;
  url?: string;
  type?: string;
}

// Deploy REST types (/plugin/products/deploy)

export interface DeployDeployment {
  id: string;
  name: string;
  status: string;
  softwarePackageId?: string;
  targetGroup?: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
}

export interface DeployProfile {
  id: string;
  name: string;
  description?: string;
}

export interface SoftwareBundle {
  id: string;
  name: string;
  description?: string;
  packages?: string[];
}

export interface TempFile {
  id: string;
  name: string;
  uploadUrl?: string;
}

// Connect REST types (/plugin/products/connect)

export interface Connection {
  id: string;
  name: string;
  status?: string;
  sourceType?: string;
  destinationType?: string;
  createdAt?: string;
  lastRunAt?: string;
}

export interface ConnectionRun {
  id: string;
  connectionId: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  rowsProcessed?: number;
}

export interface ConnectDestination {
  id: string;
  name: string;
  type: string;
}

export interface ConnectSource {
  id: string;
  name: string;
  type: string;
}

// Comply REST types (/plugin/products/comply)

export interface ComplianceResult {
  ruleId?: string;
  ruleName?: string;
  status?: string;
  endpointCount?: number;
  passCount?: number;
  failCount?: number;
  errorCount?: number;
}

export interface CVE {
  id: string;
  title?: string;
  description?: string;
  severity?: string;
  cvssScore?: number;
  affectedEndpoints?: number;
  publishedDate?: string;
}

export interface ComplianceException {
  id: string;
  ruleId?: string;
  endpointId?: string;
  reason?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  version?: string;
  platform?: string;
}

export interface CustomCheck {
  id: string;
  name: string;
  description?: string;
  platform?: string;
}

export interface ComplyBundle {
  id: string;
  name: string;
  description?: string;
}

export interface VulnerabilitySource {
  id: string;
  name: string;
  type?: string;
  lastUpdated?: string;
}

// Asset REST types (/plugin/products/asset)

export interface Asset {
  id: string;
  computerName?: string;
  ipAddress?: string;
  os?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  lastSeen?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface AssetAttribute {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

export interface AssetView {
  id: string;
  name: string;
  description?: string;
  attributes?: string[];
}

// Unified pagination envelope
export interface ToolOutput<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  pagination?: { nextCursor?: string; totalRecords?: number; hasMore: boolean };
  meta?: { respondedPercentage?: number; respondedTotal?: number; expectedTotal?: number };
}
