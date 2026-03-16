"use client";

import dynamic from "next/dynamic";
import { Gecko } from "@/app/types/gecko";
import { Skeleton } from "@/app/components/ui/skeleton";

const LineageTreeFlow = dynamic(() => import("./LineageTreeFlow"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[520px] rounded-xl" />,
});

export default function LineageTree({ gecko }: { gecko: Gecko }) {
  return <LineageTreeFlow gecko={gecko} />;
}
