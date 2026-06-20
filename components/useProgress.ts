"use client";

import { useEffect, useState } from "react";
import { loadProgress, type Progress } from "@/lib/progress";

// Reactive view of localStorage progress. Re-reads on the custom "btp:progress"
// event (same tab) and the native storage event (other tabs).
export function useProgress(): Progress {
  const [progress, setProgress] = useState<Progress>({ levels: {} });

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    refresh();
    window.addEventListener("btp:progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("btp:progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return progress;
}
