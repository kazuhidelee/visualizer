import type { StaticImageData } from "next/image";
import type {
  RepositoryInfo,
  RepositoryWorkspaceState,
  WorkspaceMode,
} from "@/lib/types";
import type { DemoVisualizerData } from "@/lib/demo-visualizer.types";

export type WorkspacePanelId =
  | "graph-source"
  | "policy-query"
  | "history"
  | "compare"
  | "metadata"
  | "settings";

export interface VisualizerWorkspaceProps {
  mode: WorkspaceMode;
  repository: RepositoryInfo;
  workspaceData?: DemoVisualizerData | null;
  workspaceState?: RepositoryWorkspaceState | null;
  isLoading: boolean;
  onBaseCompareCommitSelect: (commitHash: string) => void;
  onCommitSelect: (commitHash: string) => void;
  onCompareCommitSelect: (commitHash: string) => void;
  onMetadataFileChange: (fileName: "root.json" | "targets.json") => void;
  onPolicyQueryChange: (field: "branch" | "changedPath", value: string) => void;
  onPolicyQueryRun: () => Promise<{
    matchedBranch: string;
    matchedRule: string;
    requiredApprovals: number;
    authorizedUsers: string[];
  } | null>;
  onReload: () => void;
  onDisconnect: () => void;
}

export interface GraphInstance {
  id: string;
  offset: {
    x: number;
    y: number;
  };
}

export interface GraphWorkspaceTab {
  id: string;
  label: string;
  closable?: boolean;
  editable?: boolean;
  graphs: GraphInstance[];
}

export interface WorkspaceMenuItemConfig {
  id: WorkspacePanelId;
  label: string;
  icon: StaticImageData;
}
