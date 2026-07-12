"use client";

import { useMemo, useState } from "react";
import { demoVisualizerData } from "@/lib/demo-visualizer-fixture";
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types";
import { buildMetadataSummary } from "@/lib/policy-workspace";
import type { RepositoryWorkspaceState, WorkspaceMode } from "@/lib/types";
import completedIcon from "@/assets/completed.png";
import metadataIcon from "@/assets/metadata.png";
import { detailColors } from "@/components/visualizer/detail/workspace-detail-primitives";
import {
  PanelSection,
  SearchHighlightText,
  SectionBulletLabel,
  StatusRow,
  SummaryMetricGrid,
  ValueChip,
} from "@/components/visualizer/detail/workspace-detail-primitives";

interface DetailPanelMetadataProps {
  mode: WorkspaceMode;
  workspaceData?: DemoVisualizerData | null;
  workspaceState?: RepositoryWorkspaceState | null;
  searchQuery?: string;
}

function MetadataCodeCard({
  label,
  value,
  searchQuery,
}: {
  label: string;
  value: string;
  searchQuery?: string;
}) {
  return (
    <div
      className="space-y-3 px-4 py-3"
      style={{ backgroundColor: detailColors.summaryCard }}
    >
      <SearchHighlightText
        text={label}
        query={searchQuery}
        className="block text-[12px] text-(--dark-gray)"
      />
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-black">
        <SearchHighlightText text={value} query={searchQuery} />
      </pre>
    </div>
  );
}

export function DetailPanelMetadata({
  mode,
  workspaceData,
  workspaceState,
  searchQuery,
}: DetailPanelMetadataProps) {
  const selectedCommitHash = workspaceState?.selectedCommitHash;
  const activeSnapshot = selectedCommitHash
    ? workspaceState?.snapshotCache[selectedCommitHash]
    : undefined;
  const snapshotError = selectedCommitHash
    ? workspaceState?.snapshotErrors[selectedCommitHash]
    : "";
  const isLoadingSnapshot =
    mode === "repository" && workspaceState?.loading.selectedCommitSnapshot;
  const metadataData =
    mode === "demo"
      ? workspaceData?.workspaceDetails.metadata ??
        demoVisualizerData.workspaceDetails.metadata
      : {
          policyFiles: ["root.json", "targets.json"],
          status: {
            payloadDecoded: Boolean(activeSnapshot),
            signaturesFound: activeSnapshot ? "Snapshot cached" : "Snapshot not loaded",
            sourceCommit: selectedCommitHash?.slice(0, 7) ?? "No commit selected",
          },
          views: ["Summary", "Decoded JSON", "Envelope"],
          selectedView: "Summary",
          summary: buildMetadataSummary(activeSnapshot),
        };
  const metadataByCommit =
    mode === "demo"
      ? workspaceData?.metadataByCommit ?? demoVisualizerData.metadataByCommit
      : selectedCommitHash && activeSnapshot
        ? {
            [selectedCommitHash]: {
              "root.json": activeSnapshot.root,
              "targets.json": activeSnapshot.targets,
            },
          }
        : {};
  const [selectedView, setSelectedView] = useState(
    metadataData.selectedView ?? metadataData.views[0] ?? "Summary",
  );
  const activeView = metadataData.views.includes(selectedView)
    ? selectedView
    : metadataData.selectedView ?? metadataData.views[0] ?? "Summary";
  const sourceCommitKey = useMemo(
    () =>
      Object.keys(metadataByCommit).find((commitHash) =>
        commitHash.startsWith(metadataData.status.sourceCommit),
      ) ?? Object.keys(metadataByCommit)[0],
    [metadataByCommit, metadataData.status.sourceCommit],
  );
  const sourceMetadata = sourceCommitKey ? metadataByCommit[sourceCommitKey] : undefined;
  const decodedJsonCards = useMemo(
    () =>
      sourceMetadata
        ? Object.entries(sourceMetadata).map(([fileName, value]) => ({
            label: fileName,
            value: JSON.stringify(value, null, 2),
          }))
        : [],
    [sourceMetadata],
  );
  const envelopeCards = useMemo(
    () =>
      sourceMetadata
        ? Object.entries(sourceMetadata).map(([fileName, value]) => ({
            label: `${fileName} envelope`,
            value: JSON.stringify(
              {
                sourceCommit: sourceCommitKey,
                fileName,
                payload: value,
                signatures: metadataData.status.signaturesFound,
              },
              null,
              2,
            ),
          }))
        : [],
    [metadataData.status.signaturesFound, sourceCommitKey, sourceMetadata],
  );

  return (
    <div className="space-y-2 px-5 pb-8">
      {mode === "repository" && !selectedCommitHash ? (
        <div className="rounded-[5px] border px-4 py-3 text-[12px] text-(--dark-gray)">
          No policy commit selected.
        </div>
      ) : null}
      {isLoadingSnapshot ? (
        <div className="rounded-[5px] border px-4 py-3 text-[12px] text-(--dark-gray)">
          Loading metadata for the selected commit...
        </div>
      ) : null}
      {snapshotError ? (
        <div className="rounded-[5px] border border-(--reject-color) bg-(--reject-color-12) px-4 py-3 text-[12px] text-(--reject-color)">
          {snapshotError}
        </div>
      ) : null}
      <PanelSection label="Policy file" searchQuery={searchQuery}>
        <div className="space-y-2 text-[12px] text-(--dark-gray)">
          <SearchHighlightText
            text="Define trusted keys, roles, and root-level authority"
            query={searchQuery}
            className="text-[12px] text-(--dark-gray)"
          />
          <div className="flex flex-wrap gap-1">
            {metadataData.policyFiles.map((item, index) => (
              <ValueChip
                key={`${item}-${index}`}
                label={item}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </div>
      </PanelSection>
      <PanelSection label="Status" searchQuery={searchQuery}>
        <div className="space-y-2">
          {metadataData.status.payloadDecoded ? (
            <StatusRow
              icon={completedIcon}
              label="Payload decoded"
              searchQuery={searchQuery}
            />
          ) : null}
          <StatusRow
            icon={completedIcon}
            label={metadataData.status.signaturesFound}
            searchQuery={searchQuery}
          />
          <StatusRow
            icon={metadataIcon}
            label="Source commit"
            value={metadataData.status.sourceCommit}
            searchQuery={searchQuery}
          />
        </div>
      </PanelSection>
      <section className="space-y-4 py-4">
        <SectionBulletLabel label="View" searchQuery={searchQuery} />
        <div className="space-y-3 pl-2">
          <div className="flex w-fit overflow-hidden rounded-[3px] border border-(--secondary-color)">
            {metadataData.views.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedView(tab)}
                className={`border-r border-(--secondary-color) px-3 py-1 text-[11px] last:border-r-0 ${
                  activeView === tab
                    ? "bg-(--dark-gray) text-white"
                    : "bg-white text-(--dark-gray)"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeView === "Summary" ? (
            <SummaryMetricGrid items={metadataData.summary} searchQuery={searchQuery} />
          ) : null}
          {activeView === "Decoded JSON" ? (
            <div className="grid gap-2">
              {decodedJsonCards.length === 0 ? (
                <div className="px-2 text-[12px] text-(--dark-gray)">
                  No decoded metadata available for this commit.
                </div>
              ) : null}
              {decodedJsonCards.map((card) => (
                <MetadataCodeCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          ) : null}
          {activeView === "Envelope" ? (
            <div className="grid gap-2">
              {envelopeCards.length === 0 ? (
                <div className="px-2 text-[12px] text-(--dark-gray)">
                  No envelope data available for this commit.
                </div>
              ) : null}
              {envelopeCards.map((card) => (
                <MetadataCodeCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
