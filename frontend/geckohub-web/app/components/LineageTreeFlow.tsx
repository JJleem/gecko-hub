"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gecko, ParentGecko } from "@/app/types/gecko";
import { ExternalLink } from "lucide-react";

// ── 레이아웃 상수 ──────────────────────────────────────
const NODE_W = 160;
const NODE_H = 175;
const H_GAP  = 60;
const V_GAP  = 90;

// 자녀가 너무 많을 때 한 행에 보여줄 최대 수
const MAX_CHILDREN_PER_ROW = 5;

function getImageUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}${path}`;
}

/** 행 내 노드의 x 좌표 (가운데 정렬) */
function rowX(index: number, count: number): number {
  const totalW = count * NODE_W + (count - 1) * H_GAP;
  return -totalW / 2 + index * (NODE_W + H_GAP);
}

// ── 커스텀 노드 데이터 타입 ────────────────────────────
type GeckoNodeData = Record<string, unknown> & {
  name: string;
  morph?: string;
  profile_image: string | null;
  role: string;
  roleColor: string;
  geckoId: number;
  isCurrent: boolean;
  isExternal?: boolean;
  isClickable?: boolean;
};

// ── 커스텀 노드 컴포넌트 ──────────────────────────────
function GeckoFlowNode({ data }: NodeProps) {
  const d = data as GeckoNodeData;
  const imageUrl = d.profile_image ? getImageUrl(d.profile_image as string) : null;
  const isClickable = d.isClickable && !d.isCurrent && !d.isExternal;

  return (
    <div
      className={`w-[160px] bg-card border-2 rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-md transition-all duration-200 select-none ${
        d.isCurrent
          ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20"
          : d.isExternal
          ? "border-border/40 opacity-70"
          : isClickable
          ? "border-border/60 hover:border-primary/60 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          : "border-border/60"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "transparent", border: "none", width: 1, height: 1 }}
      />

      {/* 프로필 이미지 */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border/40 flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            fill
            className="object-cover"
            alt={d.name as string}
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl opacity-40">
            🦎
          </div>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className="text-center w-full">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${d.roleColor as string}`}>
          {d.role as string}
        </p>
        <p className="text-sm font-bold leading-tight truncate text-foreground">
          {d.name as string}
        </p>
        {d.morph && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {d.morph as string}
          </p>
        )}
        {d.isCurrent && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
            현재
          </span>
        )}
        {d.isExternal && (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 inline-block">
            외부
          </span>
        )}
        {isClickable && (
          <span className="text-[10px] text-primary/70 flex items-center justify-center gap-0.5 mt-1">
            <ExternalLink className="w-2.5 h-2.5" /> 클릭하여 이동
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "transparent", border: "none", width: 1, height: 1 }}
      />
    </div>
  );
}

const nodeTypes = { geckoNode: GeckoFlowNode };

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function LineageTreeFlow({ gecko }: { gecko: Gecko }) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const currentNodeId = `gecko-${gecko.id}`;

    // ① 부모 목록
    type ParentEntry = {
      gecko: ParentGecko | null;
      name?: string | null;
      role: string;
      roleColor: string;
      edgeColor: string;
    };
    const parents: ParentEntry[] = [];
    if (gecko.sire_detail || gecko.sire_name) {
      parents.push({
        gecko: gecko.sire_detail ?? null,
        name: gecko.sire_name,
        role: "Sire (부)",
        roleColor: "text-blue-500",
        edgeColor: "#3b82f6",
      });
    }
    if (gecko.dam_detail || gecko.dam_name) {
      parents.push({
        gecko: gecko.dam_detail ?? null,
        name: gecko.dam_name,
        role: "Dam (모)",
        roleColor: "text-pink-500",
        edgeColor: "#ec4899",
      });
    }

    // ② 부모 노드 & 엣지
    parents.forEach((p, i) => {
      const nodeId = p.gecko ? `gecko-${p.gecko.id}` : `ext-parent-${i}`;
      nodes.push({
        id: nodeId,
        type: "geckoNode",
        position: { x: rowX(i, parents.length), y: 0 },
        data: {
          name: p.gecko?.name || p.name || "알 수 없음",
          morph: p.gecko?.morph,
          profile_image: p.gecko?.profile_image ?? null,
          role: p.role,
          roleColor: p.roleColor,
          geckoId: p.gecko?.id ?? 0,
          isCurrent: false,
          isExternal: !p.gecko,
          isClickable: !!p.gecko,
        },
      });
      edges.push({
        id: `${nodeId}->${currentNodeId}`,
        source: nodeId,
        target: currentNodeId,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: p.edgeColor, width: 14, height: 14 },
        style: { stroke: p.edgeColor, strokeWidth: 2, opacity: 0.7 },
      });
    });

    // ③ 현재 게코 노드
    const currentY = parents.length > 0 ? NODE_H + V_GAP : 0;
    nodes.push({
      id: currentNodeId,
      type: "geckoNode",
      position: { x: rowX(0, 1), y: currentY },
      data: {
        name: gecko.name,
        morph: gecko.morph,
        profile_image: gecko.profile_image,
        role: "현재",
        roleColor: "text-primary",
        geckoId: gecko.id,
        isCurrent: true,
        isClickable: false,
      },
    });

    // ④ 자녀 노드 — 최대 MAX_CHILDREN_PER_ROW씩 행 분할
    const children = gecko.children ?? [];
    if (children.length > 0) {
      // 자녀를 행으로 나눔
      const rows: ParentGecko[][] = [];
      for (let i = 0; i < children.length; i += MAX_CHILDREN_PER_ROW) {
        rows.push(children.slice(i, i + MAX_CHILDREN_PER_ROW));
      }

      rows.forEach((rowChildren, rowIdx) => {
        const rowY = currentY + NODE_H + V_GAP + rowIdx * (NODE_H + V_GAP / 2);
        rowChildren.forEach((child, colIdx) => {
          const childNodeId = `child-${child.id}`;
          nodes.push({
            id: childNodeId,
            type: "geckoNode",
            position: { x: rowX(colIdx, rowChildren.length), y: rowY },
            data: {
              name: child.name,
              morph: child.morph,
              profile_image: child.profile_image,
              role: "자손",
              roleColor: "text-emerald-500",
              geckoId: child.id,
              isCurrent: false,
              isClickable: true,
            },
          });
          edges.push({
            id: `${currentNodeId}->${childNodeId}`,
            source: currentNodeId,
            target: childNodeId,
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981", width: 14, height: 14 },
            style: { stroke: "#10b981", strokeWidth: 2, opacity: 0.7 },
          });
        });
      });
    }

    return { nodes, edges };
  }, [gecko]);

  // 노드 클릭 → 해당 게코 페이지 이동
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const d = node.data as GeckoNodeData;
    if (!d.isCurrent && !d.isExternal && d.geckoId) {
      router.push(`/geckos/${d.geckoId}`);
    }
  };

  const isEmpty =
    nodes.length <= 1 &&
    (gecko.children ?? []).length === 0 &&
    !gecko.sire_detail && !gecko.sire_name &&
    !gecko.dam_detail && !gecko.dam_name;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center py-16 text-center gap-3">
        <span className="text-5xl opacity-20">🦎</span>
        <p className="text-sm font-medium text-foreground">등록된 혈통 정보가 없어요</p>
        <p className="text-xs text-muted-foreground">부모 혈통을 등록하면 트리가 나타나요</p>
        <a
          href={`/geckos/${gecko.id}/edit`}
          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
        >
          <ExternalLink className="w-3.5 h-3.5" /> 정보 수정에서 등록하기
        </a>
      </div>
    );
  }

  // 자녀 수에 따라 높이 동적 계산
  const childRows = Math.ceil((gecko.children ?? []).length / MAX_CHILDREN_PER_ROW);
  const dynamicHeight = Math.min(
    Math.max(420, 300 + childRows * (NODE_H + V_GAP / 2)),
    700,
  );

  const showMinimap = nodes.length >= 5;

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-border/50"
      style={{ height: dynamicHeight }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.1 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={resolvedTheme === "dark" ? "#334155" : "#cbd5e1"}
        />
        <Controls showInteractive={false} />
        {showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background/80 !border-border/50 rounded-lg"
          />
        )}
      </ReactFlow>
    </div>
  );
}
