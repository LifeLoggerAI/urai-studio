"use client";
import React from "react";
import type { JobState } from "@/src/lib/studioTypes";
export function JobStatePill({ state }: { state: JobState }) {
  const bg =
    state === "SUCCEEDED" ? "#0f766e" :
    state === "FAILED" ? "#b91c1c" :
    state === "RUNNING" || state === "RENDERING" || state === "UPLOADING" ? "#1d4ed8" :
    state === "CANCELED" ? "#6b7280" :
    "#111827";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      background: bg,
      color: "white",
      fontSize: 12
    }}>
      {state}
    </span>
  );
}
