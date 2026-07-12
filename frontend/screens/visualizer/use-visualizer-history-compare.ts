"use client";

import { useEffect, useMemo, useState } from "react";
import { demoVisualizerData } from "@/lib/demo-visualizer-fixture";
import type { SelectOption } from "@/components/visualizer/detail/workspace-detail-primitives";
import {
  buildCompareGraphFromSnapshot,
  buildGraphVariantsByCommit,
  buildPolicyGraphVariantFromSnapshot,
} from "@/lib/policy-workspace";
import { sortHistoryTimelineCommits } from "@/screens/visualizer/history-canvas";
import { buildComparisonResult } from "@/screens/visualizer/compare.utils";
import type { HistorySortField } from "@/screens/visualizer/history.types";
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types";
import type { RepositoryWorkspaceState, WorkspaceMode } from "@/lib/types";

export function useVisualizerHistoryCompare(
  mode: WorkspaceMode,
  workspaceData?: DemoVisualizerData | null,
  workspaceState?: RepositoryWorkspaceState | null,
) {
  const [selectedBaseVersion, setSelectedBaseVersion] = useState("");
  const [selectedCompareVersion, setSelectedCompareVersion] = useState("");
  const [hasCompared, setHasCompared] = useState(false);
  const [activeHistoryCommitId, setActiveHistoryCommitId] = useState<string | null>(
    null,
  );
  const [isHistoryStripCollapsed, setIsHistoryStripCollapsed] = useState(false);
  const [historySortField, setHistorySortField] = useState<HistorySortField>("date");
  const [isHistorySortAscending, setIsHistorySortAscending] = useState(false);

  const compareOptions = useMemo(() => {
    if (mode === "repository") {
      return (workspaceState?.commits ?? []).map((commit) => ({
        label: `${commit.hash.slice(0, 7)} • ${commit.message}`,
        value: commit.hash,
      }));
    }

    const compareData =
      workspaceData?.workspaceDetails.compare ??
      demoVisualizerData.workspaceDetails.compare;
    return compareData.baseVersionOptions.map((option) => ({
      label: option,
      value: option,
    }));
  }, [mode, workspaceData, workspaceState]);

  const baseHistoryCommits = useMemo(
    () =>
      mode === "repository"
        ? (workspaceState?.commits ?? []).map((commit) => ({
            id: commit.hash,
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            authorLabel: commit.author,
            date: commit.date,
          }))
        : (workspaceData?.workspaceDetails.history ??
            demoVisualizerData.workspaceDetails.history
          ).commits.map((commit) => ({
            id: commit.hash,
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            authorLabel: commit.authorLabel,
            date: commit.date,
          })),
    [mode, workspaceData, workspaceState],
  );
  const defaultHistorySortState = useMemo(
    () =>
      mode === "repository"
        ? {
            sortField: "date" as HistorySortField,
            isAscending: false,
          }
        : {
            sortField: (
              (workspaceData?.workspaceDetails.history.selectedSort ??
                demoVisualizerData.workspaceDetails.history.selectedSort ??
                "date") === "author"
                ? "author"
                : "date"
            ) as HistorySortField,
            isAscending:
              (workspaceData?.workspaceDetails.history.selectedSort ??
                demoVisualizerData.workspaceDetails.history.selectedSort) === "oldest",
          },
    [mode, workspaceData],
  );
  const historyCommits = useMemo(
    () =>
      sortHistoryTimelineCommits(
        baseHistoryCommits,
        historySortField,
        isHistorySortAscending,
      ),
    [baseHistoryCommits, historySortField, isHistorySortAscending],
  );
  const detailHistoryCommits = useMemo(
    () =>
      historyCommits.map((commit) => {
        const sourceCommit =
          mode === "repository"
            ? (workspaceState?.commits ?? []).find(
                (historyCommit) => historyCommit.hash === commit.hash,
              )
            : (
                workspaceData?.workspaceDetails.history ??
                demoVisualizerData.workspaceDetails.history
              ).commits.find((historyCommit) => historyCommit.hash === commit.hash);

        return {
          id:
            sourceCommit && mode === "repository"
              ? (workspaceState?.commits ?? []).findIndex(
                  (historyCommit) => historyCommit.hash === commit.hash,
                )
              : sourceCommit
                ? (
                    workspaceData?.workspaceDetails.history ??
                    demoVisualizerData.workspaceDetails.history
                  ).commits.findIndex((historyCommit) => historyCommit.hash === commit.hash)
                : -1,
          hash: commit.hash,
          // message is optional on the timeline type because older callers only
          // needed labels; the detail panel wants a guaranteed string.
          message: sourceCommit?.message ?? commit.message ?? "",
          author: commit.author,
          authorLabel: commit.authorLabel,
          date: commit.date,
        };
      }),
    [historyCommits, mode, workspaceData, workspaceState],
  );
  const defaultHistoryCommitId = useMemo(
    () =>
      mode === "repository"
        ? workspaceState?.selectedCommitHash ?? historyCommits[0]?.id ?? null
        : (
            workspaceData?.workspaceDetails.history.selectedCommitHash ??
            demoVisualizerData.workspaceDetails.history.selectedCommitHash ??
            historyCommits[0]?.id ??
            null
          ),
    [historyCommits, mode, workspaceData, workspaceState],
  );
  const graphVariantsByCommit = useMemo(
    () =>
      mode === "repository"
        ? buildGraphVariantsByCommit(workspaceState?.snapshotCache ?? {})
        : {},
    [mode, workspaceState],
  );
  const activePolicyGraph = useMemo(
    () =>
      mode === "repository"
        ? buildPolicyGraphVariantFromSnapshot(
            activeHistoryCommitId
              ? workspaceState?.snapshotCache[activeHistoryCommitId]
              : undefined,
            activeHistoryCommitId ?? workspaceState?.selectedCommitHash ?? "",
          )
        : undefined,
    [activeHistoryCommitId, mode, workspaceState],
  );

  const baseCompareGraph = useMemo(() => {
    const baseGraph =
      mode === "demo"
        ? (
            workspaceData?.workspaceDetails.compare ??
            demoVisualizerData.workspaceDetails.compare
          ).graphsByVersion[selectedBaseVersion]
        : buildCompareGraphFromSnapshot(
            selectedBaseVersion
              ? workspaceState?.snapshotCache[selectedBaseVersion]
              : undefined,
            selectedBaseVersion,
          );
    return {
      repositoryLabel: baseGraph?.repositoryLabel ?? selectedBaseVersion.slice(0, 7),
      branchLabel: baseGraph?.branchLabel ?? "Branch: main",
      lanes: baseGraph?.lanes,
    };
  }, [mode, selectedBaseVersion, workspaceData, workspaceState]);
  const comparisonResult = useMemo(
    () =>
      buildComparisonResult(
        mode === "demo"
          ? (
              workspaceData?.workspaceDetails.compare ??
              demoVisualizerData.workspaceDetails.compare
            ).graphsByVersion[selectedBaseVersion]
          : buildCompareGraphFromSnapshot(
              selectedBaseVersion
                ? workspaceState?.snapshotCache[selectedBaseVersion]
                : undefined,
              selectedBaseVersion,
            ),
        mode === "demo"
          ? (
              workspaceData?.workspaceDetails.compare ??
              demoVisualizerData.workspaceDetails.compare
            ).graphsByVersion[selectedCompareVersion]
          : buildCompareGraphFromSnapshot(
              selectedCompareVersion
                ? workspaceState?.snapshotCache[selectedCompareVersion]
                : undefined,
              selectedCompareVersion,
            ),
        selectedCompareVersion.slice(0, 7),
      ),
    [mode, selectedBaseVersion, selectedCompareVersion, workspaceData, workspaceState],
  );
  const compareGraph = useMemo(() => {
    return {
      repositoryLabel: comparisonResult.compareGraph.repositoryLabel,
      branchLabel: comparisonResult.compareGraph.branchLabel,
      lanes: comparisonResult.compareGraph.lanes,
      showCompareLegend: comparisonResult.compareGraph.showLegend ?? true,
    };
  }, [comparisonResult]);

  useEffect(() => {
    // History selection follows the currently sorted commit list so the detail
    // panel, timeline strip, and history canvases stay synchronized.
    setActiveHistoryCommitId(defaultHistoryCommitId);
  }, [defaultHistoryCommitId]);

  useEffect(() => {
    setHistorySortField(defaultHistorySortState.sortField);
    setIsHistorySortAscending(defaultHistorySortState.isAscending);
  }, [defaultHistorySortState]);

  useEffect(() => {
    // Compare state is seeded from the current workspace payload whenever the
    // repository/demo source changes, and it resets stale cross-repository pairs.
    if (mode === "repository") {
      setSelectedBaseVersion(workspaceState?.selectedBaseCompareCommitHash ?? "");
      setSelectedCompareVersion(workspaceState?.selectedCompareCommitHash ?? "");
    } else {
      setSelectedBaseVersion(compareOptions[0]?.value ?? "");
      setSelectedCompareVersion(compareOptions[1]?.value ?? compareOptions[0]?.value ?? "");
    }
    setHasCompared(false);
  }, [compareOptions, mode, workspaceState]);

  return {
    activeHistoryCommitId,
    activePolicyGraph,
    compareOptions,
    baseCompareGraph,
    comparisonResult,
    compareGraph,
    detailHistoryCommits,
    graphVariantsByCommit,
    hasCompared,
    historyCommits,
    historySortField,
    isHistorySortAscending,
    isHistoryStripCollapsed,
    selectedBaseVersion,
    selectedCompareVersion,
    setActiveHistoryCommitId,
    setHasCompared,
    setHistorySortField,
    setIsHistorySortAscending,
    setIsHistoryStripCollapsed,
    setSelectedBaseVersion,
    setSelectedCompareVersion,
  };
}
