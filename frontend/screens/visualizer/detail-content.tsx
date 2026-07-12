"use client";

import { useEffect, useState } from "react";
import { demoVisualizerData } from "@/lib/demo-visualizer-fixture";
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types";
import type {
  RepositoryInfo,
  RepositoryWorkspaceState,
  WorkspaceMode,
} from "@/lib/types";
import {
  DetailPanelCompare,
  DetailPanelGraphSource,
  DetailPanelHistory,
  DetailPanelMetadata,
  DetailPanelPolicyQuery,
  DetailPanelSettings,
} from "@/screens/visualizer/panel-tabs/detail-panels";
import type { SelectOption } from "@/components/visualizer/detail/workspace-detail-primitives";
import type { VisualizerComparisonResult } from "@/screens/visualizer/compare.utils";
import type { HistorySortField } from "@/screens/visualizer/history.types";
import type { WorkspacePanelId } from "@/screens/visualizer/visualizer.types";

interface WorkspaceDetailContentProps {
  mode: WorkspaceMode;
  activePanel: WorkspacePanelId;
  repository: RepositoryInfo;
  workspaceData?: DemoVisualizerData | null;
  workspaceState?: RepositoryWorkspaceState | null;
  onCommitSelect: (commitHash: string) => void;
  onMetadataFileChange: (fileName: "root.json" | "targets.json") => void;
  onPolicyQueryChange: (field: "branch" | "changedPath", value: string) => void;
  onPolicyQueryRun: () => Promise<{
    matchedBranch: string;
    matchedRule: string;
    requiredApprovals: number;
    authorizedUsers: string[];
  } | null>;
  onRegenerate: () => void;
  isLoading?: boolean;
  historyCommits: Array<{
    id: number;
    hash: string;
    message: string;
    author: string;
    authorLabel?: string;
    date: string;
  }>;
  selectedHistoryCommitHash?: string | null;
  onHistoryCommitSelect?: (commitHash: string) => void;
  searchQuery?: string;
  selectedHistorySort: HistorySortField;
  isHistorySortAscending: boolean;
  onHistorySortChange: (sortField: HistorySortField) => void;
  onHistorySortDirectionToggle: () => void;
  compareVersionOptions: SelectOption[];
  selectedBaseVersion: string;
  selectedCompareVersion: string;
  comparisonResult: VisualizerComparisonResult;
  hasCompared: boolean;
  onBaseVersionChange: (value: string) => void;
  onCompareVersionChange: (value: string) => void;
  onSwapVersions: () => void;
  onCompare: () => void;
}

export function WorkspaceDetailContent({
  mode,
  activePanel,
  repository,
  workspaceData,
  workspaceState,
  onCommitSelect,
  onMetadataFileChange,
  onPolicyQueryChange,
  onPolicyQueryRun,
  onRegenerate,
  isLoading = false,
  historyCommits,
  selectedHistoryCommitHash,
  onHistoryCommitSelect,
  searchQuery,
  selectedHistorySort,
  isHistorySortAscending,
  onHistorySortChange,
  onHistorySortDirectionToggle,
  compareVersionOptions,
  selectedBaseVersion,
  selectedCompareVersion,
  comparisonResult,
  hasCompared,
  onBaseVersionChange,
  onCompareVersionChange,
  onSwapVersions,
  onCompare,
}: WorkspaceDetailContentProps) {
  const policyQueryDefaults =
    mode === "demo"
      ? workspaceData?.workspaceDetails.policyQuery ??
        demoVisualizerData.workspaceDetails.policyQuery
      : {
          branchOptions: [workspaceState?.policyQuery.branch || "main"],
          selectedBranch: workspaceState?.policyQuery.branch || "main",
          changedPathOptions: [workspaceState?.policyQuery.changedPath || "/"],
          selectedChangedPath: workspaceState?.policyQuery.changedPath || "/",
          queryResult: {
            matchedBranch: workspaceState?.policyQuery.branch || "main",
            matchedRule: "",
            requiredApprovals: 0,
          },
          authorizedUsers: [] as string[],
        };
  const [selectedBranch, setSelectedBranch] = useState(
    policyQueryDefaults.selectedBranch ?? policyQueryDefaults.branchOptions[0],
  );
  const [selectedChangedPath, setSelectedChangedPath] = useState(
    policyQueryDefaults.selectedChangedPath ??
      policyQueryDefaults.changedPathOptions[0],
  );
  const [showPolicyQueryResults, setShowPolicyQueryResults] = useState(false);
  const [policyQueryResultState, setPolicyQueryResultState] = useState({
    matchedBranch:
      workspaceState?.policyQuery.result?.matchedBranch ??
      policyQueryDefaults.queryResult.matchedBranch,
    matchedRule:
      workspaceState?.policyQuery.result?.matchedRule ??
      policyQueryDefaults.queryResult.matchedRule,
    requiredApprovals:
      workspaceState?.policyQuery.result?.requiredApprovals ??
      policyQueryDefaults.queryResult.requiredApprovals,
    authorizedUsers:
      workspaceState?.policyQuery.result?.authorizedUsers ??
      policyQueryDefaults.authorizedUsers,
  });

  useEffect(() => {
    setSelectedBranch(policyQueryDefaults.selectedBranch ?? policyQueryDefaults.branchOptions[0] ?? "main");
    setSelectedChangedPath(
      policyQueryDefaults.selectedChangedPath ?? policyQueryDefaults.changedPathOptions[0] ?? "",
    );
    setPolicyQueryResultState({
      matchedBranch:
        workspaceState?.policyQuery.result?.matchedBranch ??
        policyQueryDefaults.queryResult.matchedBranch,
      matchedRule:
        workspaceState?.policyQuery.result?.matchedRule ??
        policyQueryDefaults.queryResult.matchedRule,
      requiredApprovals:
        workspaceState?.policyQuery.result?.requiredApprovals ??
        policyQueryDefaults.queryResult.requiredApprovals,
      authorizedUsers:
        workspaceState?.policyQuery.result?.authorizedUsers ??
        policyQueryDefaults.authorizedUsers,
    });
    setShowPolicyQueryResults(Boolean(workspaceState?.policyQuery.result));
  }, [policyQueryDefaults, workspaceState]);

  switch (activePanel) {
    case "graph-source":
      return (
        <DetailPanelGraphSource
          mode={mode}
          repository={repository}
          workspaceData={workspaceData}
          workspaceState={workspaceState}
          onCommitSelect={onCommitSelect}
          onMetadataFileChange={onMetadataFileChange}
          onRegenerate={onRegenerate}
          isLoading={isLoading}
          searchQuery={searchQuery}
        />
      );
    case "policy-query":
      return (
        <DetailPanelPolicyQuery
          mode={mode}
          workspaceData={workspaceData}
          workspaceState={workspaceState}
          searchQuery={searchQuery}
          selectedBranch={selectedBranch}
          selectedChangedPath={selectedChangedPath}
          showResults={showPolicyQueryResults}
          resultState={policyQueryResultState}
          onBranchChange={(value) => {
            setSelectedBranch(value);
            setShowPolicyQueryResults(false);
            if (mode === "repository") {
              onPolicyQueryChange("branch", value);
            }
          }}
          onChangedPathChange={(value) => {
            setSelectedChangedPath(value);
            setShowPolicyQueryResults(false);
            if (mode === "repository") {
              onPolicyQueryChange("changedPath", value);
            }
          }}
          onQuery={async (result) => {
            if (mode === "repository") {
              const nextResult = await onPolicyQueryRun();
              if (!nextResult) return;
              setPolicyQueryResultState(nextResult);
              setShowPolicyQueryResults(true);
              return;
            }

            setPolicyQueryResultState(result);
            setShowPolicyQueryResults(true);
          }}
        />
      );
    case "history":
      return (
        <DetailPanelHistory
          mode={mode}
          workspaceData={workspaceData}
          workspaceState={workspaceState}
          commits={historyCommits}
          selectedCommitHash={selectedHistoryCommitHash}
          onSelectedCommitChange={onHistoryCommitSelect}
          searchQuery={searchQuery}
          sortOptions={
            mode === "demo"
              ? Array.from(
                  new Set(
                    (
                      workspaceData?.workspaceDetails.history ??
                      demoVisualizerData.workspaceDetails.history
                    ).sortOptions.map((option) =>
                      option === "author" ? "author" : "date",
                    ),
                  ),
                ) as HistorySortField[]
              : ["date", "author"]
          }
          selectedSort={selectedHistorySort}
          isAscending={isHistorySortAscending}
          onSortChange={onHistorySortChange}
          onSortDirectionToggle={onHistorySortDirectionToggle}
        />
      );
    case "compare":
      return (
        <DetailPanelCompare
          mode={mode}
          workspaceData={workspaceData}
          workspaceState={workspaceState}
          searchQuery={searchQuery}
          versionOptions={compareVersionOptions}
          selectedBaseVersion={selectedBaseVersion}
          selectedCompareVersion={selectedCompareVersion}
          comparisonResult={comparisonResult}
          hasCompared={hasCompared}
          onBaseVersionChange={onBaseVersionChange}
          onCompareVersionChange={onCompareVersionChange}
          onSwapVersions={onSwapVersions}
          onCompare={onCompare}
        />
      );
    case "metadata":
      return (
        <DetailPanelMetadata
          mode={mode}
          workspaceData={workspaceData}
          workspaceState={workspaceState}
          searchQuery={searchQuery}
        />
      );
    case "settings":
      return (
        <DetailPanelSettings
          mode={mode}
          workspaceData={workspaceData}
          searchQuery={searchQuery}
        />
      );
    default:
      return null;
  }
}
