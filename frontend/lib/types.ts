export interface Commit {
  hash: string
  message: string
  author: string
  date: string
  data?: JsonObject
}

export interface RepositoryInfo {
  type: "remote" | "local"
  path: string
  name: string
  branch?: string
}

export interface PolicySnapshot {
  root: JsonObject
  targets: JsonObject
}

export interface PolicyQueryResult {
  matchedBranch: string
  matchedRule: string
  requiredApprovals: number
  authorizedUsers: string[]
}

export type WorkspaceMode = "demo" | "repository"

export interface RepositoryWorkspaceState {
  commits: Commit[]
  selectedCommitHash: string | null
  selectedBaseCompareCommitHash: string | null
  selectedCompareCommitHash: string | null
  snapshotCache: Record<string, PolicySnapshot>
  snapshotErrors: Record<string, string>
  activeMetadataFile: "root.json" | "targets.json"
  loading: {
    reload: boolean
    selectedCommitSnapshot: boolean
    compareSnapshot: boolean
    policyQuery: boolean
  }
  errors: {
    repository: string | null
    policyQuery: string | null
  }
  policyQuery: {
    branch: string
    changedPath: string
    result: PolicyQueryResult | null
  }
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonArray = JsonValue[]
export interface JsonObject {
  [key: string]: JsonValue
}

export interface SecurityEvent {
  commit: string
  date: string
  author: string
  message: string
  type: "security_enhancement" | "security_degradation" | "policy_change" | "principal_change" | "expiration_change"
  severity: "critical" | "high" | "medium" | "low"
  description: string
  details: string
  impact: string
}

export interface SecurityTrend {
  metric: string
  trend: "improving" | "declining" | "stable"
  current: number
  previous: number
  description: string
}
