"use client";

import Image from "next/image";
import Link from "next/link";
import { CareLog, ParentGecko } from "../types/gecko";

// shadcn & 아이콘
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  HeartHandshake,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function MatingTracker({
  logs,
  currentGeckoId,
}: {
  logs: CareLog[];
  currentGeckoId: number;
}) {
  const matingLogs = logs
    .filter((log) => log.log_type === "Mating")
    .sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime(),
    );

  // 🛠 [핵심 함수] 이미지 주소 변환 (엑박 방지)
  const getFullImageUrl = (path: string | null): string => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `https://gecko-hub.vercel.app${path}`;
  };

  return (
    <Card className="h-full shadow-sm border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-pink-500" /> 메이팅 기록
        </CardTitle>
        {matingLogs.length > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            최근 기록순
          </span>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {matingLogs.length > 0 ? (
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px] md:w-[120px]">날짜</TableHead>
                  <TableHead>파트너</TableHead>
                  <TableHead className="text-center w-[80px]">결과</TableHead>
                  <TableHead className="hidden md:table-cell">메모</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matingLogs.map((log) => {
                  // 🔥 상대방 찾기 로직
                  let otherGecko: ParentGecko | undefined | null = null;
                  let isExternal = false;
                  let externalName = "";

                  if (log.gecko === currentGeckoId) {
                    otherGecko = log.partner_detail;
                    if (!otherGecko && log.partner_name) {
                      isExternal = true;
                      externalName = log.partner_name;
                    }
                  } else {
                    otherGecko = log.gecko_detail;
                  }

                  const imageUrl = otherGecko
                    ? getFullImageUrl(otherGecko.profile_image)
                    : "";

                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs md:text-sm whitespace-nowrap">
                        {log.log_date}
                      </TableCell>

                      {/* 파트너 영역 */}
                      <TableCell>
                        {otherGecko ? (
                          <Link
                            href={`/geckos/${otherGecko.id}`}
                            className="flex items-center gap-3 w-fit group"
                          >
                            <div className="relative w-8 h-8 rounded-full bg-muted border border-border/50 overflow-hidden group-hover:border-primary transition-colors shrink-0">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt="partner"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold">
                                  NO
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-sm group-hover:text-primary transition-colors">
                              {otherGecko.name}
                            </span>
                          </Link>
                        ) : isExternal ? (
                          <div className="flex items-center gap-3 w-fit">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50 shrink-0">
                              <HelpCircle className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">
                                {externalName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                외부 개체
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* 결과 뱃지 */}
                      <TableCell className="text-center">
                        {log.mating_success ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 gap-1 pl-1.5 pr-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 성공
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground gap-1 pl-1.5 pr-2 bg-muted hover:bg-muted"
                          >
                            <XCircle className="w-3.5 h-3.5" /> 실패
                          </Badge>
                        )}
                      </TableCell>

                      {/* 메모 (모바일 숨김) */}
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[150px] truncate">
                        {log.note || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/10 rounded-lg border border-dashed border-border text-center m-4 sm:m-0">
            <HeartHandshake className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">
              아직 메이팅 기록이 없습니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
