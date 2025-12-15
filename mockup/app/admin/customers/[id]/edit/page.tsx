"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { customers, Customer } from "@/lib/data/mock";

export default function CustomerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">顧客が見つかりません</h1>
            <p className="text-muted-foreground">
              指定された顧客IDの情報が見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 会員区分の状態管理
  const isMember = customer.type !== "非会員";
  const auditMember = customer.type === "監査役協会会員";
  const naikanMember = customer.type === "ないかんMeetup会員";

  // フォームの状態管理
  const [isMemberState, setIsMemberState] = useState<"member" | "non-member">(
    isMember ? "member" : "non-member"
  );
  const [auditMemberState, setAuditMemberState] = useState(auditMember);
  const [naikanMemberState, setNaikanMemberState] = useState(naikanMember);
  const [nameParts, setNameParts] = useState(() => {
    const parts = customer.name.split(" ");
    return {
      lastName: parts[0] || "",
      firstName: parts[1] || "",
    };
  });
  const [nameKanaParts, setNameKanaParts] = useState(() => {
    const parts = customer.nameKana?.split(" ") || ["", ""];
    return {
      lastNameKana: parts[0] || "",
      firstNameKana: parts[1] || "",
    };
  });
  const [email, setEmail] = useState(customer.email);
  const [company, setCompany] = useState(customer.company || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [note, setNote] = useState(customer.note || "");
  const [isInactive, setIsInactive] = useState(customer.status === "inactive");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("顧客情報を更新しました");
    router.push(`/admin/customers/${id}`);
  };

  const handleDelete = () => {
    toast.success("顧客を削除しました");
    router.push("/admin/customers");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/customers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">顧客編集</h1>
          <p className="text-muted-foreground">
            顧客情報を編集・更新します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border p-8 shadow-sm">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>会員区分 <span className="text-red-500">*</span></Label>
            <RadioGroup
              value={isMemberState}
              onValueChange={(value) => {
                setIsMemberState(value as "member" | "non-member");
                if (value === "non-member") {
                  setAuditMemberState(false);
                  setNaikanMemberState(false);
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
            
            {isMemberState === "member" && (
              <div className="ml-6 mt-2 flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audit"
                    checked={auditMemberState}
                    onCheckedChange={(checked) => setAuditMemberState(checked === true)}
                  />
                  <Label htmlFor="audit" className="cursor-pointer">監査役協会</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="naikan"
                    checked={naikanMemberState}
                    onCheckedChange={(checked) => setNaikanMemberState(checked === true)}
                  />
                  <Label htmlFor="naikan" className="cursor-pointer">ないかんMeetup</Label>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastName">姓 <span className="text-red-500">*</span></Label>
              <Input
                id="lastName"
                placeholder="例: 山田"
                value={nameParts.lastName}
                onChange={(e) =>
                  setNameParts({ ...nameParts, lastName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                placeholder="例: 太郎"
                value={nameParts.firstName}
                onChange={(e) =>
                  setNameParts({ ...nameParts, firstName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastNameKana">セイ <span className="text-red-500">*</span></Label>
              <Input
                id="lastNameKana"
                placeholder="例: ヤマダ"
                value={nameKanaParts.lastNameKana}
                onChange={(e) =>
                  setNameKanaParts({ ...nameKanaParts, lastNameKana: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstNameKana">メイ <span className="text-red-500">*</span></Label>
              <Input
                id="firstNameKana"
                placeholder="例: タロウ"
                value={nameKanaParts.firstNameKana}
                onChange={(e) =>
                  setNameKanaParts({ ...nameKanaParts, firstNameKana: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company">会社名・所属</Label>
            <Input
              id="company"
              placeholder="例: 株式会社マルコポーロ"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="例: 03-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">備考</Label>
            <Textarea
              id="note"
              placeholder="紹介者や特記事項など"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inactive"
                checked={isInactive}
                onCheckedChange={(checked) => setIsInactive(checked === true)}
              />
              <Label htmlFor="inactive" className="cursor-pointer">
                非アクティブ
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              非アクティブにすると、この顧客は検索結果から除外されます。
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="cursor-pointer">
            更新する
          </Button>
        </div>
      </form>

      <div className="pt-4 box-border">
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>顧客を削除</DialogTitle>
              <DialogDescription>
                この顧客を削除してもよろしいですか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="cursor-pointer"
              >
                キャンセル
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

