"use client";
import React from "react";
export function StudioShell(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{props.title}</h1>
        <div style={{ fontSize: 12, opacity: 0.7 }}>URAI Studio • Friend Mode v1</div>
      </div>
      <div style={{ marginTop: 16 }}>{props.children}</div>
    </div>
  );
}
