"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { events } from "@/lib/data/mock";
import { Plus } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">イベント管理</h1>
          <p className="text-muted-foreground">
            イベントの作成、編集、招待管理を行います。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4" />
            イベント作成
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>イベント名</TableHead>
              <TableHead>開催日時</TableHead>
              <TableHead>場所</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>参加予定数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  window.location.href = `/admin/events/${event.id}`;
                }}
              >
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.status === "open"
                        ? "default"
                        : event.status === "planning"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {event.status === "open"
                      ? "受付中"
                      : event.status === "planning"
                      ? "企画中"
                      : "終了"}
                  </Badge>
                </TableCell>
                <TableCell>{event.attendeesCount}名</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>編集</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
