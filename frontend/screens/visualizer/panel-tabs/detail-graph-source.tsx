"use client";

import { useEffect, useState } from "react";
import { demoVisualizerData } from "@/lib/demo-visualizer-fixture";
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types";
import type { SelectOption } from "@/components/visualizer/detail/workspace-detail-primitives";
import type {
  RepositoryInfo,
  RepositoryWorkspaceState,
  WorkspaceMode,
} from "@/lib/types";
import {
  DetailActionButton,
  InlineSelectRow,
  StaticValueRow,
} from "@/components/visualizer/detail/workspace-detail-primitives";

interface DetailPanelGraphSourceProps {
  mode: WorkspaceMode;
  repository: RepositoryInfo;
  workspaceData?: DemoVisualizerData | null;
  workspaceState?: RepositoryWorkspaceState | null;
  onCommitSelect: (commitHash: string) => void;
  onMetadataFileChange: (fileName: "root.json" | "targets.json") => void;
  onRegenerate: () => void;
  isLoading?: boolean;
  searchQuery?: string;
}

export function DetailPanelGraphSource({
  mode,
  repository,
  workspaceData,
  workspaceState,
  onCommitSelect,
  onMetadataFileChange,
  onRegenerate,
  isLoading = false,
  searchQuery,
}: DetailPanelGraphSourceProps) {
  const graphSource =
    mode === "demo"
      ? workspaceData?.workspaceDetails.graphSource ??
        demoVisualizerData.workspaceDetails.graphSource
      : null;
  const commitOptions: SelectOption[] =
    mode === "repository"
      ? (workspaceState?.commits ?? []).map((commit) => ({
          label: `${commit.hash.slice(0, 7)} • ${commit.message}`,
          value: commit.hash,
        }))
      : (graphSource?.policyVersionOptions ?? []).map((label) => ({ label, value: label }));
  const metadataOptions =
    mode === "repository"
      ? ["root.json", "targets.json"]
      : (graphSource?.metadataOptions ?? []);
  const activeModeOptions =
    mode === "repository" ? ["Repository"] : (graphSource?.activeModeOptions ?? []);
  const [selectedPolicyVersion, setSelectedPolicyVersion] = useState(
    mode === "repository"
      ? workspaceState?.selectedCommitHash ?? commitOptions[0]?.value
      : graphSource?.policyVersion ?? commitOptions[0]?.value,
  );
  const [selectedMetadataFile, setSelectedMetadataFile] = useState(
    mode === "repository"
      ? workspaceState?.activeMetadataFile ?? metadataOptions[0]
      : graphSource?.metadataFile ?? metadataOptions[0],
  );
  const [selectedActiveMode, setSelectedActiveMode] = useState(
    mode === "repository"
      ? activeModeOptions[0]
      : graphSource?.activeMode ?? activeModeOptions[0],
  );

  useEffect(() => {
    if (mode !== "repository") return

    setSelectedPolicyVersion(workspaceState?.selectedCommitHash ?? commitOptions[0]?.value ?? "")
    setSelectedMetadataFile(workspaceState?.activeMetadataFile ?? metadataOptions[0] ?? "root.json")
  }, [commitOptions, metadataOptions, mode, workspaceState])
  const isRepositorySnapshotLoading =
    mode === "repository" && workspaceState?.loading.selectedCommitSnapshot

  return (
    <div className="space-y-2 px-5 pb-8">
      {isRepositorySnapshotLoading ? (
        <div className="rounded-[5px] border px-4 py-3 text-[12px] text-(--dark-gray)">
          Loading selected commit metadata...
        </div>
      ) : null}
      {mode === "repository" && workspaceState?.selectedCommitHash && workspaceState.snapshotErrors[workspaceState.selectedCommitHash] ? (
        <div className="rounded-[5px] border border-(--reject-color) bg-(--reject-color-12) px-4 py-3 text-[12px] text-(--reject-color)">
          {workspaceState.snapshotErrors[workspaceState.selectedCommitHash]}
        </div>
      ) : null}
      <StaticValueRow
        label="Repository:"
        value={graphSource?.repository ?? repository.name}
        searchQuery={searchQuery}
      />
      <StaticValueRow
        label="Policy ref:"
        value={graphSource?.policyRef ?? "refs/gittuf/policy"}
        searchQuery={searchQuery}
      />
      <InlineSelectRow
        label="Policy version:"
        options={commitOptions}
        selectedLabel={selectedPolicyVersion}
        chips={[
          mode === "repository"
            ? commitOptions.find((option) => option.value === selectedPolicyVersion)?.label ??
              selectedPolicyVersion ??
              ""
            : selectedPolicyVersion ?? "",
        ]}
        onChange={(value) => {
          setSelectedPolicyVersion(value);
          if (mode === "repository") {
            onCommitSelect(value);
          }
        }}
        searchQuery={searchQuery}
      />
      <InlineSelectRow
        label="Metadata:"
        options={metadataOptions.map((label) => ({ label }))}
        selectedLabel={selectedMetadataFile}
        chips={[selectedMetadataFile]}
        onChange={(value) => {
          setSelectedMetadataFile(value);
          if (value === "root.json" || value === "targets.json") {
            onMetadataFileChange(value);
          }
        }}
        searchQuery={searchQuery}
      />
      <InlineSelectRow
        label="Active mode"
        options={activeModeOptions.map((label) => ({ label }))}
        selectedLabel={selectedActiveMode}
        chips={[selectedActiveMode]}
        onChange={setSelectedActiveMode}
        searchQuery={searchQuery}
      />
      <div className="pl-2 pt-8">
        <DetailActionButton
          label="Regenerate"
          onClick={onRegenerate}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
