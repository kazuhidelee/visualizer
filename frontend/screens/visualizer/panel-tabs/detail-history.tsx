"use client";

import { useEffect } from "react";
import Image from "next/image";
import ascendingIcon from "@/assets/ascending.png";
import discendingIcon from "@/assets/discending.png";
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types";
import type { RepositoryWorkspaceState } from "@/lib/types";
import { useWorkspaceHistory } from "@/hooks/visualizer/use-workspace-history";
import {
  CommitHistoryItem,
  detailColors,
  SelectField,
} from "@/components/visualizer/detail/workspace-detail-primitives";
import type {
  HistorySortField,
} from "@/screens/visualizer/history.types";

interface DetailHistoryCommit {
  id: number;
  hash: string;
  message: string;
  author: string;
  authorLabel?: string;
  date: string;
}

interface DetailPanelHistoryProps {
  mode: "demo" | "repository";
  workspaceData?: DemoVisualizerData | null;
  workspaceState?: RepositoryWorkspaceState | null;
  commits: DetailHistoryCommit[];
  selectedCommitHash?: string | null;
  onSelectedCommitChange?: (commitHash: string) => void;
  searchQuery?: string;
  sortOptions: HistorySortField[];
  selectedSort: HistorySortField;
  isAscending: boolean;
  onSortChange: (sortField: HistorySortField) => void;
  onSortDirectionToggle: () => void;
}

export function DetailPanelHistory({
  mode,
  workspaceData,
  workspaceState,
  commits,
  selectedCommitHash,
  onSelectedCommitChange,
  searchQuery = "",
  sortOptions,
  selectedSort,
  isAscending,
  onSortChange,
  onSortDirectionToggle,
}: DetailPanelHistoryProps) {
  const {
    commitListRef,
    commitsPerPage,
    currentPage,
    selectedCommitId,
    setCurrentPage,
    setSelectedCommitId,
    setTouchedCommitId,
    totalPages,
    touchedCommitId,
    visibleCommits,
  } = useWorkspaceHistory(commits, selectedCommitHash ?? (mode === "demo" ? workspaceData?.workspaceDetails.history.selectedCommitHash : undefined));

  useEffect(() => {
    if (!selectedCommitHash) return;

    const nextSelectedCommit = commits.find(
      (commit) => commit.hash === selectedCommitHash,
    );
    if (!nextSelectedCommit || nextSelectedCommit.id === selectedCommitId) return;

    const nextSelectedCommitIndex = commits.findIndex(
      (commit) => commit.id === nextSelectedCommit.id,
    );
    setSelectedCommitId(nextSelectedCommit.id);
    setCurrentPage(Math.floor(nextSelectedCommitIndex / commitsPerPage) + 1);
  }, [
    commits,
    commitsPerPage,
    selectedCommitHash,
    selectedCommitId,
    setCurrentPage,
    setSelectedCommitId,
  ]);

  return (
    <div className="flex h-full flex-col px-1 pb-4">
      {mode === "repository" && (workspaceState?.errors.repository || commits.length === 0) ? (
        <div className="px-4 pb-4 pt-2 text-[12px] text-(--dark-gray)">
          {workspaceState?.errors.repository || "No policy commits found for this repository."}
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-2">
        <SelectField
          options={sortOptions.map((option) => ({
            label: `Sort by: ${option}`,
            value: option,
          }))}
          selectedLabel={selectedSort}
          displayLabel={`Sort by: ${selectedSort}`}
          onChange={(value) => onSortChange(value as HistorySortField)}
          className="w-33"
        />
        <button
          type="button"
          onClick={onSortDirectionToggle}
          aria-label={`Sort ${isAscending ? "ascending" : "descending"}. Click to switch to ${
            isAscending ? "descending" : "ascending"
          } order.`}
          title={isAscending ? "Ascending order" : "Descending order"}
          className="flex h-9 w-6 items-center justify-center"
        >
          <Image
            src={isAscending ? ascendingIcon : discendingIcon}
            alt=""
            className="h-4 w-4"
          />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={commitListRef} className="min-h-0 flex-1 overflow-hidden">
          {visibleCommits.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-(--dark-gray)">
              Nothing to show yet.
            </div>
          ) : null}
          {visibleCommits.map((commit) => (
            <CommitHistoryItem
              key={commit.id}
              commitId={commit.id}
              message={commit.message}
              author={commit.authorLabel ?? `opened by ${commit.author}`}
              searchQuery={searchQuery}
              isSelected={selectedCommitId === commit.id}
              isTouched={touchedCommitId === commit.id}
              onSelect={(commitId) => {
                setSelectedCommitId(commitId);
                const selectedCommit = commits.find(
                  (historyCommit) => historyCommit.id === commitId,
                );
                if (!selectedCommit || !onSelectedCommitChange) return;
                if (selectedCommit.hash === selectedCommitHash) return;

                onSelectedCommitChange(selectedCommit.hash);
              }}
              onTouch={setTouchedCommitId}
            />
          ))}
        </div>
        <div className="mt-auto flex items-center justify-center gap-10 px-4 pt-6">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage <= 1}
            className="rounded-sm border border-(--secondary-color) px-3 py-1 text-[12px] text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            &lt; Previous
          </button>
          <div className="flex items-center gap-3 text-[12px]">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const isActive = currentPage === pageNumber;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`rounded-sm px-2 py-1 ${
                    isActive ? "text-black" : "text-(--dark-gray)"
                  }`}
                  style={isActive ? { backgroundColor: detailColors.bullet } : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-sm border border-(--secondary-color) px-3 py-1 text-[12px] text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
