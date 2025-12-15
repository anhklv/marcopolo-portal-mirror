"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isMember, setIsMember] = useState<"member" | "non-member">("non-member");
  const [auditMember, setAuditMember] = useState(false);
  const [naikanMember, setNaikanMember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("顧客情報を登録しました");
    router.push("/admin/customers");
  };

  return (
    <div className="max-w-4xl space-y-6">
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

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>会員区分 <span className="text-red-500">*</span></Label>
            <RadioGroup
              value={isMember}
              onValueChange={(value) => {
                setIsMember(value as "member" | "non-member");
                if (value === "non-member") {
                  setAuditMember(false);
                  setNaikanMember(false);
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-member" id="non-member" />
                <Label htmlFor="non-member" className="cursor-pointer">非会員</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member" className="cursor-pointer">会員</Label>
              </div>
            </RadioGroup>
            
            {isMember === "member" && (
              <div className="ml-6 mt-2 flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audit"
                    checked={auditMember}
                    onCheckedChange={(checked) => setAuditMember(checked === true)}
                  />
                  <Label htmlFor="audit" className="cursor-pointer">監査役協会</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="naikan"
                    checked={naikanMember}
                    onCheckedChange={(checked) => setNaikanMember(checked === true)}
                  />
                  <Label htmlFor="naikan" className="cursor-pointer">ないかんMeetup</Label>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastName">姓 <span className="text-red-500">*</span></Label>
              <Input id="lastName" placeholder="例: 山田" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
              <Input id="firstName" placeholder="例: 太郎" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastNameKana">セイ <span className="text-red-500">*</span></Label>
              <Input id="lastNameKana" placeholder="例: ヤマダ" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstNameKana">メイ <span className="text-red-500">*</span></Label>
              <Input id="firstNameKana" placeholder="例: タロウ" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
            <Input id="email" type="email" placeholder="name@example.com" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company">会社名・所属</Label>
            <Input id="company" placeholder="例: 株式会社マルコポーロ" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input id="phone" type="tel" placeholder="例: 03-1234-5678" />
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
          <Button type="submit" variant="outline" className="cursor-pointer">登録する</Button>
        </div>
      </form>
    </div>
  );
}
