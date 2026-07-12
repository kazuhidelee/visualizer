import type { DemoCompareGraph } from "@/lib/demo-visualizer.types"
import type { PolicyGraphCanvasVariant } from "@/screens/visualizer/policy-graph.types"
import type { JsonObject, PolicySnapshot } from "@/lib/types"

interface PolicyRole {
  name: string
  paths: string[]
  principalIds: string[]
  threshold: number
}

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : []
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : 0
}

function resolvePrincipalName(snapshot: PolicySnapshot, principalId: string) {
  const delegations = asObject(snapshot.targets.delegations)
  const targetsPrincipals = asObject(delegations?.principals)
  const rootPrincipals = asObject(snapshot.root.principals)

  const targetsPrincipal = asObject(targetsPrincipals?.[principalId])
  if (targetsPrincipal) {
    const personId = stringValue(targetsPrincipal.personID)
    if (personId) {
      return personId
    }
  }

  if (rootPrincipals?.[principalId]) {
    return principalId
  }

  return principalId
}

function getPolicyRoles(snapshot: PolicySnapshot): PolicyRole[] {
  const delegations = asObject(snapshot.targets.delegations)
  const rawRoles = Array.isArray(delegations?.roles) ? delegations.roles : []

  return rawRoles
    .map((role) => asObject(role))
    .filter((role): role is JsonObject => Boolean(role))
    .map((role) => ({
      name: stringValue(role.name),
      paths: stringArray(role.paths),
      principalIds: stringArray(role.principalIDs ?? role.principalids),
      threshold: numberValue(role.threshold),
    }))
}

function getDisplayPaths(paths: string[]) {
  const branchPaths = paths.filter((path) => path.startsWith("git:refs/heads/"))
  const filePaths = paths.filter((path) => !path.startsWith("git:refs/heads/"))

  return {
    branchLabel:
      branchPaths[0]?.replace("git:refs/heads/", "Branch: ") ?? "Branch: main",
    pathLabels: filePaths.length > 0 ? filePaths : [paths[0] ?? "*"],
  }
}

export function buildPolicyGraphVariantFromSnapshot(
  snapshot: PolicySnapshot | undefined,
  commitHash: string,
): PolicyGraphCanvasVariant {
  if (!snapshot) {
    return {
      repositoryLabel: commitHash.slice(0, 7),
      branchLabel: "Branch: main",
      lanes: [],
      showCompareLegend: true,
    }
  }

  const roles = getPolicyRoles(snapshot)
  const lanes = roles.flatMap((role, roleIndex) => {
    const { branchLabel, pathLabels } = getDisplayPaths(role.paths)
    const principalNames = role.principalIds.map((principalId) =>
      resolvePrincipalName(snapshot, principalId),
    )

    return pathLabels.map((pathLabel, pathIndex) => ({
      key: `${role.name || "role"}-${roleIndex}-${pathIndex}`,
      pathLabel,
      roleLabel: role.name || "Authorized users",
      approvals: `Requires: ${role.threshold} approval${role.threshold === 1 ? "" : "s"}`,
      principals: principalNames.map((name) => ({ name })),
      branchStatus: undefined,
      status: undefined,
      pathStatus: undefined,
      roleStatus: undefined,
      approvalsStatus: undefined,
      branchLabel,
    }))
  })

  return {
    repositoryLabel: commitHash.slice(0, 7),
    branchLabel:
      lanes[0]?.branchLabel && typeof lanes[0].branchLabel === "string"
        ? lanes[0].branchLabel
        : "Branch: main",
    lanes: lanes.map(({ branchLabel: _branchLabel, ...lane }) => lane),
    showCompareLegend: true,
  }
}

export function buildCompareGraphFromSnapshot(
  snapshot: PolicySnapshot | undefined,
  commitHash: string,
): DemoCompareGraph {
  return buildPolicyGraphVariantFromSnapshot(snapshot, commitHash) as DemoCompareGraph
}

export function buildGraphVariantsByCommit(
  snapshotsByCommit: Record<string, PolicySnapshot>,
) {
  return Object.fromEntries(
    Object.entries(snapshotsByCommit).map(([commitHash, snapshot]) => [
      commitHash,
      buildPolicyGraphVariantFromSnapshot(snapshot, commitHash),
    ]),
  ) satisfies Record<string, PolicyGraphCanvasVariant>
}

export function buildMetadataSummary(snapshot: PolicySnapshot | undefined) {
  if (!snapshot) {
    return [
      { value: "0", label: "roles" },
      { value: "0", label: "principals" },
      { value: "0", label: "file rules" },
      { value: "0", label: "snapshots" },
    ]
  }

  const roles = getPolicyRoles(snapshot)
  const principalNames = new Set(
    roles.flatMap((role) => role.principalIds.map((principalId) => resolvePrincipalName(snapshot, principalId))),
  )
  const fileRuleCount = roles.reduce((count, role) => {
    const { pathLabels } = getDisplayPaths(role.paths)
    return count + pathLabels.length
  }, 0)

  return [
    { value: String(roles.length), label: "roles" },
    { value: String(principalNames.size), label: "principals" },
    { value: String(fileRuleCount), label: "file rules" },
    { value: "1", label: "snapshots" },
  ]
}
