"use client"

import { useState } from "react"
import { demoVisualizerData } from "@/lib/demo-visualizer-fixture"
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types"
import { fetchCommits, fetchSnapshot, queryPolicy } from "@/lib/api"
import type {
  Commit,
  RepositoryInfo,
  RepositoryWorkspaceState,
  WorkspaceMode,
} from "@/lib/types"

function sortCommitsNewestFirst(commits: Commit[]) {
  return [...commits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

async function findFirstLoadableSnapshot(
  repository: RepositoryInfo,
  commits: Commit[],
) {
  const snapshotErrors: Record<string, string> = {}

  for (const commit of commits) {
    try {
      const snapshot = await fetchSnapshot(repository, commit.hash)
      return {
        selectedCommitHash: commit.hash,
        snapshot,
        snapshotErrors,
      }
    } catch (error) {
      snapshotErrors[commit.hash] = errorMessage(error)
    }
  }

  return {
    selectedCommitHash: null,
    snapshot: null,
    snapshotErrors,
  }
}

export function useRepositorySession() {
  const [mode, setMode] = useState<WorkspaceMode>("demo")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentRepository, setCurrentRepository] = useState<RepositoryInfo | null>(null)
  const [demoWorkspaceData, setDemoWorkspaceData] = useState<DemoVisualizerData | null>(null)
  const [repositoryWorkspaceState, setRepositoryWorkspaceState] =
    useState<RepositoryWorkspaceState | null>(null)
  const [showRepositorySelector, setShowRepositorySelector] = useState(true)

  const ensureSnapshotForCommit = async (
    repository: RepositoryInfo,
    commitHash: string,
  ) => {
    if (repositoryWorkspaceState?.snapshotCache[commitHash]) {
      return
    }

    try {
      const snapshot = await fetchSnapshot(repository, commitHash)

      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              snapshotCache: {
                ...currentState.snapshotCache,
                [commitHash]: snapshot,
              },
              snapshotErrors: {
                ...currentState.snapshotErrors,
                [commitHash]: "",
              },
            }
          : currentState,
      )
    } catch (error) {
      const message = errorMessage(error)

      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              snapshotErrors: {
                ...currentState.snapshotErrors,
                [commitHash]: message,
              },
            }
          : currentState,
      )

      throw error
    }
  }

  const handleTryDemo = async (onSuccess?: () => void) => {
    const demoRepository: RepositoryInfo = demoVisualizerData.repository

    setMode("demo")
    setCurrentRepository(demoRepository)
    setDemoWorkspaceData(demoVisualizerData)
    setRepositoryWorkspaceState(null)
    setIsLoading(true)
    setError("")

    try {
      setShowRepositorySelector(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepositorySelect = async (repoInfo: RepositoryInfo, onSuccess?: () => void) => {
    setMode("repository")
    setCurrentRepository(repoInfo)
    setDemoWorkspaceData(null)
    setIsLoading(true)
    setError("")

    try {
      const commits = sortCommitsNewestFirst(await fetchCommits(repoInfo))
      const initialSnapshot = await findFirstLoadableSnapshot(repoInfo, commits)
      const selectedCommitHash = initialSnapshot.selectedCommitHash
      setRepositoryWorkspaceState({
        commits,
        selectedCommitHash,
        selectedBaseCompareCommitHash: selectedCommitHash,
        selectedCompareCommitHash:
          commits.find((commit) => commit.hash !== selectedCommitHash)?.hash ?? selectedCommitHash,
        snapshotCache:
          selectedCommitHash && initialSnapshot.snapshot
            ? { [selectedCommitHash]: initialSnapshot.snapshot }
            : {},
        snapshotErrors: initialSnapshot.snapshotErrors,
        activeMetadataFile: "root.json",
        loading: {
          reload: false,
          selectedCommitSnapshot: false,
          compareSnapshot: false,
          policyQuery: false,
        },
        errors: {
          repository:
            commits.length === 0
              ? "No policy commits found for this repository."
              : selectedCommitHash
                ? null
                : "No commit in this repository contains both metadata/root.json and metadata/targets.json.",
          policyQuery: null,
        },
        policyQuery: {
          branch: "main",
          changedPath: "",
          result: null,
        },
      })
      setShowRepositorySelector(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepositoryRefresh = async () => {
    if (!currentRepository || mode !== "repository") return

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            loading: {
              ...currentState.loading,
              reload: true,
            },
            errors: {
              ...currentState.errors,
              repository: null,
            },
          }
        : currentState,
    )

    try {
      const commits = sortCommitsNewestFirst(await fetchCommits(currentRepository))

      setRepositoryWorkspaceState((currentState) => {
        if (!currentState) {
          return currentState
        }

        const selectedCommitHash =
          currentState.selectedCommitHash &&
          commits.some((commit) => commit.hash === currentState.selectedCommitHash)
            ? currentState.selectedCommitHash
            : (commits[0]?.hash ?? null)

        return {
          commits,
          selectedCommitHash,
          selectedBaseCompareCommitHash:
            currentState.selectedBaseCompareCommitHash &&
            commits.some((commit) => commit.hash === currentState.selectedBaseCompareCommitHash)
              ? currentState.selectedBaseCompareCommitHash
              : selectedCommitHash,
          selectedCompareCommitHash:
            currentState.selectedCompareCommitHash &&
            commits.some((commit) => commit.hash === currentState.selectedCompareCommitHash)
              ? currentState.selectedCompareCommitHash
              : (commits[1]?.hash ?? selectedCommitHash),
          snapshotCache: currentState.snapshotCache,
          snapshotErrors: currentState.snapshotErrors,
          activeMetadataFile: currentState.activeMetadataFile,
          loading: {
            ...currentState.loading,
            reload: false,
            selectedCommitSnapshot: Boolean(selectedCommitHash) && !currentState.snapshotCache[selectedCommitHash ?? ""],
          },
          errors: {
            ...currentState.errors,
            repository: commits.length === 0 ? "No policy commits found for this repository." : null,
          },
          policyQuery: currentState.policyQuery,
        }
      })
      const nextSelectedCommitHash =
        repositoryWorkspaceState?.selectedCommitHash &&
        commits.some((commit) => commit.hash === repositoryWorkspaceState.selectedCommitHash)
          ? repositoryWorkspaceState.selectedCommitHash
          : (commits[0]?.hash ?? null)
      if (nextSelectedCommitHash) {
        await ensureSnapshotForCommit(currentRepository, nextSelectedCommitHash)
      }
    } catch (err) {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              errors: {
                ...currentState.errors,
                repository: errorMessage(err),
              },
            }
          : currentState,
      )
    } finally {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              loading: {
                ...currentState.loading,
                reload: false,
                selectedCommitSnapshot: false,
              },
            }
          : currentState,
      )
    }
  }

  const handleCommitSelect = async (commitHash: string) => {
    if (!currentRepository || mode !== "repository") return

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            selectedCommitHash: commitHash,
          }
        : currentState,
    )

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            loading: {
              ...currentState.loading,
              selectedCommitSnapshot: true,
            },
          }
        : currentState,
    )

    try {
      await ensureSnapshotForCommit(currentRepository, commitHash)
    } catch (err) {
    } finally {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              loading: {
                ...currentState.loading,
                selectedCommitSnapshot: false,
              },
            }
          : currentState,
      )
    }
  }

  const handleMetadataFileChange = (fileName: "root.json" | "targets.json") => {
    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            activeMetadataFile: fileName,
          }
        : currentState,
    )
  }

  const handlePolicyQueryChange = (
    field: "branch" | "changedPath",
    value: string,
  ) => {
    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            policyQuery: {
              ...currentState.policyQuery,
              [field]: value,
              result: null,
            },
            errors: {
              ...currentState.errors,
              policyQuery: null,
            },
          }
        : currentState,
    )
  }

  const handlePolicyQueryRun = async () => {
    if (!currentRepository || mode !== "repository" || !repositoryWorkspaceState?.selectedCommitHash) {
      return null
    }

    const { branch, changedPath } = repositoryWorkspaceState.policyQuery

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            loading: {
              ...currentState.loading,
              policyQuery: true,
            },
            errors: {
              ...currentState.errors,
              policyQuery: null,
            },
          }
        : currentState,
    )

    try {
      const result = await queryPolicy(
        currentRepository,
        repositoryWorkspaceState.selectedCommitHash,
        branch,
        changedPath,
      )

      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              policyQuery: {
              ...currentState.policyQuery,
              result,
            },
            errors: {
              ...currentState.errors,
              policyQuery: null,
            },
          }
        : currentState,
      )

      return result
    } catch (err) {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              errors: {
                ...currentState.errors,
                policyQuery: errorMessage(err),
              },
            }
          : currentState,
      )
      return null
    } finally {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              loading: {
                ...currentState.loading,
                policyQuery: false,
              },
            }
          : currentState,
      )
    }
  }

  const handleBaseCompareCommitSelect = async (commitHash: string) => {
    if (!currentRepository || mode !== "repository") return

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            selectedBaseCompareCommitHash: commitHash,
          }
        : currentState,
    )

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            loading: {
              ...currentState.loading,
              compareSnapshot: true,
            },
          }
        : currentState,
    )

    try {
      await ensureSnapshotForCommit(currentRepository, commitHash)
    } finally {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              loading: {
                ...currentState.loading,
                compareSnapshot: false,
              },
            }
          : currentState,
      )
    }
  }

  const handleCompareCommitSelect = async (commitHash: string) => {
    if (!currentRepository || mode !== "repository") return

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            selectedCompareCommitHash: commitHash,
          }
        : currentState,
    )

    setRepositoryWorkspaceState((currentState) =>
      currentState
        ? {
            ...currentState,
            loading: {
              ...currentState.loading,
              compareSnapshot: true,
            },
          }
        : currentState,
    )

    try {
      await ensureSnapshotForCommit(currentRepository, commitHash)
    } finally {
      setRepositoryWorkspaceState((currentState) =>
        currentState
          ? {
              ...currentState,
              loading: {
                ...currentState.loading,
                compareSnapshot: false,
              },
            }
          : currentState,
      )
    }
  }

  const handleDisconnect = () => {
    setMode("demo")
    setIsLoading(false)
    setError("")
    setCurrentRepository(null)
    setDemoWorkspaceData(null)
    setRepositoryWorkspaceState(null)
    setShowRepositorySelector(true)
  }

  return {
    mode,
    demoWorkspaceData,
    repositoryWorkspaceState,
    isLoading,
    error,
    currentRepository,
    showRepositorySelector,
    handleBaseCompareCommitSelect,
    handleCommitSelect,
    handleCompareCommitSelect,
    handleDisconnect,
    handleMetadataFileChange,
    handlePolicyQueryChange,
    handlePolicyQueryRun,
    handleTryDemo,
    handleRepositorySelect,
    handleRepositoryRefresh,
  }
}
