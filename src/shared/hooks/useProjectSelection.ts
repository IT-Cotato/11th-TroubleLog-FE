import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectList } from "@/hooks/useProjectList";
import type { ProjectListItem } from "@/types/project.model";

export interface UseProjectSelectionOptions {
  initialProjectId: number | null;
}

export interface UseProjectSelectionResult {
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
  initialProjectId: number | null;
  projectList: ProjectListItem[];
  projectNames: string[];
  nameToId: Map<string, number>;
  projectNameById: (id?: number | null) => string;
  loading: boolean;
}

export function useProjectSelection({
  initialProjectId,
}: UseProjectSelectionOptions): UseProjectSelectionResult {
  const { data: projectList = [], loading } = useProjectList();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (initialProjectId != null) setSelectedProjectId(Number(initialProjectId));
  }, [initialProjectId]);

  const projectNames = useMemo(
    () => projectList.map((p) => p.name),
    [projectList]
  );
  const nameToId = useMemo(
    () => new Map(projectList.map((p) => [p.name, p.id])),
    [projectList]
  );
  const projectNameById = useCallback(
    (id?: number | null) => projectList.find((p) => p.id === id)?.name ?? "",
    [projectList]
  );

  return {
    selectedProjectId,
    setSelectedProjectId,
    initialProjectId,
    projectList,
    projectNames,
    nameToId,
    projectNameById,
    loading,
  };
}
