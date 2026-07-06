import React, { useEffect, useRef } from "react";

/**
 * URAI Brain Map UI (Frontend Core)
 * Lightweight interactive system graph renderer
 * Will later connect to /system-graph API
 */

type Node = {
  id: string;
  label: string;
  type: "core" | "analytics" | "execution" | "content" | "spatial" | "comms" | "foundation";
};

const nodes: Node[] = [
  { id: "urai-admin", label: "URAI Admin", type: "core" },
  { id: "urai-jobs", label: "URAI Jobs", type: "execution" },
  { id: "urai-analytics", label: "URAI Analytics", type: "analytics" },
  { id: "urai-content", label: "URAI Content", type: "content" },
  { id: "asset-factory", label: "Asset Factory", type: "content" },
  { id: "urai-spatial", label: "URAI Spatial", type: "spatial" },
  { id: "urai-studio", label: "URAI Studio", type: "content" },
  { id: "urai-comms", label: "URAI Communications", type: "comms" },
  { id: "urai-foundation", label: "URAI Foundation", type: "foundation" }
];

const edges: Array<{ from: string; to: string }> = [
  { from: "urai-admin", to: "urai-jobs" },
  { from: "urai-admin", to: "urai-analytics" },
  { from: "urai-jobs", to: "asset-factory" },
  { from: "urai-jobs", to: "urai-content" },
  { from: "urai-content", to: "urai-spatial" },
  { from: "urai-admin", to: "urai-foundation" }
];

export default function BrainMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const positions: Record<string, { x: number; y: number }> = {};

    const radius = Math.min(width, height) / 3;

    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      positions[n.id] = {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius
      };
    });

    function draw() {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(120,120,120,0.4)";
      edges.forEach((e) => {
        const a = positions[e.from];
        const b = positions[e.to];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      nodes.forEach((n) => {
        const p = positions[n.id];
        if (!p) return;

        const color =
          n.type === "core"
            ? "#ffcc00"
            : n.type === "execution"
            ? "#00ccff"
            : n.type === "analytics"
            ? "#ff6699"
            : n.type === "spatial"
            ? "#66ff99"
            : "#cccccc";

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#111";
        ctx.font = "12px sans-serif";
        ctx.fillText(n.label, p.x + 22, p.y + 4);
      });
    }

    draw();
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh" }} />;
}