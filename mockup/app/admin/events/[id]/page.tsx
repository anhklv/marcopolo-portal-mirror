"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, UserCheck, Edit, MoreVertical, Pause } from "lucide-react";
import { events, customers, rsvps } from "@/lib/data/mock";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const event = events.find((e) => e.id === id) || events[0];

  // このイベントのRSVPデータを取得
  const eventRsvps = rsvps.filter((r) => r.eventId === id);
  
  // 参加者リストを作成（RSVPデータと顧客データを結合）
  const attendees = eventRsvps.map((rsvp) => {
    const customer = customers.find((c) => c.id === rsvp.customerId);
    if (!customer) return null;
    const { status: _, ...customerWithoutStatus } = customer;
    return {
      ...customerWithoutStatus,
      rsvpStatus: rsvp.status || "未回答",
      respondedAt: rsvp.respondedAt || "-",
    };
  }).filter((a): a is NonNullable<typeof a> => a !== null);

  // 集計サマリを計算
  const attendCount = attendees.filter((a) => a.rsvpStatus === "参加").length;
  const declineCount = attendees.filter((a) => a.rsvpStatus === "不参加").length;
  const noResponseCount = attendees.filter((a) => a.rsvpStatus === "未回答").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              <Badge variant={event.status === "open" ? "default" : event.status === "closed" ? "outline" : "secondary"}>
                {event.status === "open"
                  ? "受付中"
                  : event.status === "planning"
                  ? "企画中"
                  : "終了"}
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
              <Link href={`/admin/events/${id}/edit`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                編集
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="bg-white hover:bg-gray-100 cursor-pointer">
              <Link href={`/admin/events/${id}/invite`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                招待
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="bg-white hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                一時停止
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
            <Tabs defaultValue="attendees">
                <TabsList>
                    <TabsTrigger value="attendees" className="cursor-pointer">参加状況</TabsTrigger>
                    <TabsTrigger value="detail" className="cursor-pointer">詳細</TabsTrigger>
                </TabsList>
                
                <TabsContent value="attendees" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>参加者リスト</CardTitle>
                            <CardDescription>現在の回答状況です。</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>氏名</TableHead>
                                        <TableHead>会社名</TableHead>
                                        <TableHead>ステータス</TableHead>
                                        <TableHead>回答日時</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendees.map((attendee) => (
                                        <TableRow key={attendee.id}>
                                            <TableCell>{attendee.name}</TableCell>
                                            <TableCell>{attendee.company}</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={
                                                        attendee.rsvpStatus === "参加" ? "default" : 
                                                        attendee.rsvpStatus === "不参加" ? "destructive" : "secondary"
                                                    }
                                                    className={cn(
                                                        attendee.rsvpStatus === "未回答" && "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                                        attendee.rsvpStatus === "不参加" && "text-foreground"
                                                    )}
                                                >
                                                    {attendee.rsvpStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{attendee.respondedAt === "-" ? "-" : attendee.respondedAt}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="detail" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">開催日時</Label>
                                    <div className="mt-1 text-base">{event.date}</div>
                                </div>
                                
                                {event.location && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">場所</Label>
                                        <div className="mt-1 text-base whitespace-pre-wrap">{event.location}</div>
                                    </div>
                                )}
                                
                                {event.description && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">イベント概要</Label>
                                        <div className="mt-1 text-base whitespace-pre-wrap">{event.description}</div>
                                    </div>
                                )}
                                
                                {event.responseDeadline && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">回答期限</Label>
                                        <div className="mt-1 text-base">{event.responseDeadline}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>集計サマリ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{attendCount}</div>
                            <div className="text-xs text-green-800">参加</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{declineCount}</div>
                            <div className="text-xs text-red-800">不参加</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2">
                            <div className="text-2xl font-bold text-gray-600">{noResponseCount}</div>
                            <div className="text-xs text-gray-800">未回答</div>
                        </div>
                    </div>
                    {event.responseDeadline && (
                        <div className="pt-4 border-t">
                            <div className="text-sm text-muted-foreground">回答受付期限</div>
                            <div className="text-sm font-medium">{event.responseDeadline}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>アクション</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start cursor-pointer">
                        <Mail className="h-4 w-4" />
                        未回答者に再送
                    </Button>
                    <Button variant="outline" className="w-full justify-start cursor-pointer" asChild>
                        <Link href={`/events/${id}/rsvp?token=demo-token`} target="_blank">
                            <UserCheck className="h-4 w-4" />
                            参加回答フォーム (サンプル)
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
