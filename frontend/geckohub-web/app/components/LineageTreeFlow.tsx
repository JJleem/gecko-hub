"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gecko, ParentGecko } from "@/app/types/gecko";

// ── 레이아웃 상수 ──────────────────────────────────────
const NODE_W = 160;
const NODE_H = 175;
const H_GAP = 60;
const V_GAP = 80;

function getImageUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `https://gecko-hub.vercel.app${path}`;
}

/** 행 내 노드의 x 좌표 계산 (행 전체가 x=0 기준 가운데 정렬) */
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
};

// ── 커스텀 노드 컴포넌트 ──────────────────────────────
function GeckoFlowNode({ data }: NodeProps) {
  const d = data as GeckoNodeData;
  const imageUrl = d.profile_image ? getImageUrl(d.profile_image as string) : null;

  return (
    <div
      className={`w-[160px] bg-card border-2 rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-md transition-all duration-200 ${
        d.isCurrent
          ? "border-primary shadow-lg shadow-primary/10"
          : d.isExternal
          ? "border-border/40"
          : "border-border/60 hover:border-primary/50 hover:shadow-lg cursor-pointer"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "transparent", border: "none", width: 8, height: 8 }}
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
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "transparent", border: "none", width: 8, height: 8 }}
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

    // ① 부모 목록 구성
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

    // ② 부모 노드 & 엣지 추가
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
        },
      });
      edges.push({
        id: `${nodeId}->${currentNodeId}`,
        source: nodeId,
        target: currentNodeId,
        type: "smoothstep",
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
        role: "본인",
        roleColor: "text-primary",
        geckoId: gecko.id,
        isCurrent: true,
      },
    });

    // ④ 자녀 노드 & 엣지 추가
    const children = gecko.children ?? [];
    if (children.length > 0) {
      const childY = currentY + NODE_H + V_GAP;
      children.forEach((child, i) => {
        const childNodeId = `child-${child.id}`;
        nodes.push({
          id: childNodeId,
          type: "geckoNode",
          position: { x: rowX(i, children.length), y: childY },
          data: {
            name: child.name,
            morph: child.morph,
            profile_image: child.profile_image,
            role: "자손",
            roleColor: "text-emerald-500",
            geckoId: child.id,
            isCurrent: false,
          },
        });
        edges.push({
          id: `${currentNodeId}->${childNodeId}`,
          source: currentNodeId,
          target: childNodeId,
          type: "smoothstep",
          style: { stroke: "#10b981", strokeWidth: 2, opacity: 0.7 },
        });
      });
    }

    return { nodes, edges };
  }, [gecko]);

  // 노드 클릭 시 해당 게코 페이지로 이동
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const d = node.data as GeckoNodeData;
    if (!d.isCurrent && !d.isExternal && d.geckoId) {
      router.push(`/geckos/${d.geckoId}`);
    }
  };

  const isEmpty = nodes.length <= 1 && (gecko.children ?? []).length === 0
    && !gecko.sire_detail && !gecko.sire_name
    && !gecko.dam_detail && !gecko.dam_name;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center py-16 text-center gap-3">
        <span className="text-5xl opacity-20">🦎</span>
        <p className="text-sm text-muted-foreground">등록된 혈통 정보가 없습니다.</p>
        <a
          href={`/geckos/${gecko.id}/edit`}
          className="text-sm text-primary hover:underline"
        >
          정보 수정에서 부모 혈통을 등록해보세요
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-border/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1.2 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={resolvedTheme === "dark" ? "#334155" : "#cbd5e1"}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
