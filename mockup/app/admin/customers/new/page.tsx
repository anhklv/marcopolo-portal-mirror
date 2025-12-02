"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("顧客情報を登録しました");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">顧客登録</h1>
          <p className="text-muted-foreground">
            新しい顧客情報をシステムに登録します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">氏名</Label>
            <Input id="name" placeholder="例: 山田 太郎" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company">会社名</Label>
            <Input id="company" placeholder="例: 株式会社マルコポーロ" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="name@example.com" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">会員区分</Label>
            <Select defaultValue="非会員">
              <SelectTrigger>
                <SelectValue placeholder="会員区分を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="監査役協会会員">監査役協会会員</SelectItem>
                <SelectItem value="ないかんMeetup会員">ないかんMeetup会員</SelectItem>
                <SelectItem value="非会員">非会員</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">備考</Label>
            <Textarea id="note" placeholder="紹介者や特記事項など" />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/customers">キャンセル</Link>
          </Button>
          <Button type="submit">登録する</Button>
        </div>
      </form>
    </div>
  );
}
