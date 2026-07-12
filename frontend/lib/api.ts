import type {
  Commit,
  PolicyQueryResult,
  PolicySnapshot,
  RepositoryInfo,
} from "./types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080"

interface ApiErrorResponse {
  error?: string
  details?: string
}

async function postJson<TResponse>(
  endpoint: string,
  body: Record<string, string>,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null
    const message = [error?.error, error?.details].filter(Boolean).join(": ")
    throw new Error(message || "Request failed")
  }

  return response.json()
}

export async function fetchCommits(repository: RepositoryInfo): Promise<Commit[]> {
  return repository.type === "remote"
    ? postJson<Commit[]>("/commits", { url: repository.path })
    : postJson<Commit[]>("/commits-local", { path: repository.path })
}

export async function fetchSnapshot(
  repository: RepositoryInfo,
  commitHash: string,
): Promise<PolicySnapshot> {
  return repository.type === "remote"
    ? postJson<PolicySnapshot>("/metadata", {
        url: repository.path,
        commit: commitHash,
      })
    : postJson<PolicySnapshot>("/metadata-local", {
        path: repository.path,
        commit: commitHash,
      })
}

export async function queryPolicy(
  repository: RepositoryInfo,
  commitHash: string,
  branch: string,
  changedPath: string,
): Promise<PolicyQueryResult> {
  return repository.type === "remote"
    ? postJson<PolicyQueryResult>("/policy-query", {
        url: repository.path,
        commit: commitHash,
        branch,
        changedPath,
      })
    : postJson<PolicyQueryResult>("/policy-query-local", {
        path: repository.path,
        commit: commitHash,
        branch,
        changedPath,
      })
}
