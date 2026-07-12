"use client";

import { useMemo, useState } from "react";
import branchIcon from "@/assets/branch.png";
import emptyFileIcon from "@/assets/empty_file.png";
import { demoVisualizerData } from "@/lib/demo-visualizer-fixture";
import type {
  DemoPolicyQueryData,
  DemoVisualizerData,
} from "@/lib/demo-visualizer.types";
import type { RepositoryWorkspaceState, WorkspaceMode } from "@/lib/types";
import {
  DetailActionButton,
  PanelSection,
  QueryUserCard,
  SectionBulletLabel,
  SelectField,
  SummaryMetricGrid,
} from "@/components/visualizer/detail/workspace-detail-primitives";
import { Input } from "@/components/ui/input";

interface DetailPanelPolicyQueryProps {
  mode: WorkspaceMode;
  workspaceData?: DemoVisualizerData | null;
  workspaceState?: RepositoryWorkspaceState | null;
  searchQuery?: string;
  selectedBranch: string;
  selectedChangedPath: string;
  showResults: boolean;
  resultState: {
    matchedBranch: string;
    matchedRule: string;
    requiredApprovals: number;
    authorizedUsers: string[];
  };
  onBranchChange: (value: string) => void;
  onChangedPathChange: (value: string) => void;
  onQuery: (result: {
    matchedBranch: string;
    matchedRule: string;
    requiredApprovals: number;
    authorizedUsers: string[];
  }) => void | Promise<void>;
}

export function DetailPanelPolicyQuery({
  mode,
  workspaceData,
  workspaceState,
  searchQuery,
  selectedBranch,
  selectedChangedPath,
  showResults,
  resultState,
  onBranchChange,
  onChangedPathChange,
  onQuery,
}: DetailPanelPolicyQueryProps) {
  const [isQuerying, setIsQuerying] = useState(false);
  const policyQuery: DemoPolicyQueryData | {
    branchOptions: string[];
    changedPathOptions: string[];
    queryResult: {
      matchedBranch: string;
      matchedRule: string;
      requiredApprovals: number;
    };
    authorizedUsers: string[];
  } =
    mode === "demo"
      ? workspaceData?.workspaceDetails.policyQuery ??
        demoVisualizerData.workspaceDetails.policyQuery
      : {
          branchOptions: [workspaceState?.policyQuery.branch || "main"],
          changedPathOptions: [workspaceState?.policyQuery.changedPath || "/"],
          queryResult: {
            matchedBranch: workspaceState?.policyQuery.branch || "main",
            matchedRule: "",
            requiredApprovals: 0,
          },
          authorizedUsers: [],
        };
  const branchOptions = policyQuery.branchOptions;
  const changedPathOptions = policyQuery.changedPathOptions;
  const policyQueryError = workspaceState?.errors.policyQuery;
  const isRepositoryQueryLoading =
    mode === "repository" && workspaceState?.loading.policyQuery;
  const queryScenario = useMemo(
    () =>
      ("queryScenarios" in policyQuery ? policyQuery.queryScenarios : undefined)?.find(
        (scenario) =>
          scenario.branch === selectedBranch &&
          scenario.changedPath === selectedChangedPath,
      ),
    [policyQuery, selectedBranch, selectedChangedPath],
  );

  return (
    <div className="space-y-2 px-5 pb-8">
      <PanelSection label="Branch" searchQuery={searchQuery}>
        {mode === "repository" ? (
          <Input
            value={selectedBranch}
            onChange={(event) => onBranchChange(event.target.value)}
            placeholder="main"
            className="h-9"
          />
        ) : (
          <SelectField
            options={branchOptions.map((label) => ({ label, icon: branchIcon }))}
            selectedLabel={selectedBranch}
            onChange={onBranchChange}
            fullWidth
          />
        )}
      </PanelSection>
      <PanelSection label="Changed path" searchQuery={searchQuery}>
        {mode === "repository" ? (
          <Input
            value={selectedChangedPath}
            onChange={(event) => onChangedPathChange(event.target.value)}
            placeholder="src/app.ts"
            className="h-9"
          />
        ) : (
          <SelectField
            options={changedPathOptions.map((label) => ({ label, icon: emptyFileIcon }))}
            selectedLabel={selectedChangedPath}
            onChange={onChangedPathChange}
            fullWidth
          />
        )}
      </PanelSection>
      <div className="pl-2 pt-2">
        <DetailActionButton
          label="Query policy"
          loading={isQuerying || Boolean(isRepositoryQueryLoading)}
          onClick={() => {
            setIsQuerying(true);
            Promise.resolve(
              onQuery({
                matchedBranch:
                  queryScenario?.matchedBranch ??
                  policyQuery.queryResult.matchedBranch ??
                  selectedBranch,
                matchedRule:
                  queryScenario?.matchedRule ??
                  policyQuery.queryResult.matchedRule ??
                  selectedChangedPath,
                requiredApprovals:
                  queryScenario?.requiredApprovals ??
                  policyQuery.queryResult.requiredApprovals ??
                  2,
                authorizedUsers:
                  queryScenario?.authorizedUsers ??
                  policyQuery.authorizedUsers,
              }),
            ).finally(() => {
              window.setTimeout(() => setIsQuerying(false), 250);
            });
          }}
        />
      </div>
      {policyQueryError ? (
        <div className="rounded-[5px] border border-(--reject-color) bg-(--reject-color-12) px-4 py-3 text-[12px] text-(--reject-color)">
          {policyQueryError}
        </div>
      ) : null}
      {showResults ? (
        <>
          <PanelSection label="Query Result" className="pt-6" searchQuery={searchQuery}>
            <SummaryMetricGrid
              searchQuery={searchQuery}
              items={[
                {
                  value: resultState.matchedBranch,
                  label: "Matched branch",
                },
                {
                  value: resultState.matchedRule,
                  label: "Matched rule",
                },
                {
                  value: String(resultState.requiredApprovals),
                  label: "required approvals",
                },
              ]}
            />
          </PanelSection>
          <section className="space-y-4 py-4">
            <SectionBulletLabel label="Authorized users" searchQuery={searchQuery} />
            <div className="flex flex-wrap gap-5">
              {resultState.authorizedUsers.map((user) => (
                <QueryUserCard key={user} name={user} searchQuery={searchQuery} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
