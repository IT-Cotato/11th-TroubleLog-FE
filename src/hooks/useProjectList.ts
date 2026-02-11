import { useEffect, useState } from "react";
import { getProjectList } from "@/api/project.api";
import type { ProjectListItem } from "@/models/project.model";

export function useProjectList() {
  const [data, setData] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getProjectList();
        if (mounted) setData(res.content ?? []);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
