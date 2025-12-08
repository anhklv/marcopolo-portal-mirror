"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewEventPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("イベントを作成しました");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">イベント作成</h1>
          <p className="text-muted-foreground">
            新しいイベントを作成します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">イベント名 <span className="text-red-500">*</span></Label>
            <Input id="title" placeholder="例: 第10回 監査役交流会" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">開催日時 <span className="text-red-500">*</span></Label>
            <Input 
              id="date" 
              type="datetime-local" 
              required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">場所 <span className="text-red-500">*</span></Label>
            <Input 
              id="location" 
              placeholder="例: 東京都港区六本木 1-1-1 会議室A" 
              required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">詳細説明</Label>
            <Textarea 
              id="description" 
              placeholder="イベントの詳細やテーマなどを入力してください" 
              rows={5}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="responseDeadline">回答期限</Label>
            <Input 
              id="responseDeadline" 
              type="datetime-local" 
            />
            <p className="text-xs text-muted-foreground">
              回答期限を設定しない場合、イベント開催日まで回答を受け付けます。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/events">キャンセル</Link>
          </Button>
          <Button type="submit">作成する</Button>
        </div>
      </form>
    </div>
  );
}

