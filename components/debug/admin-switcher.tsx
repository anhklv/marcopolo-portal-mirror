"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDebugAdminList, switchDebugAdmin } from "@/lib/actions/debug";

interface DebugAdmin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  communities: { code: string; name: string }[];
}

interface AdminSwitcherProps {
  currentEmail: string;
}

/**
 * DropdownMenu内のサブメニュー部分
 */
export function AdminSwitcherMenu({
  currentEmail,
  onPasswordRequired,
}: AdminSwitcherProps & {
  onPasswordRequired: (admin: DebugAdmin) => void;
}) {
  const router = useRouter();
  const [admins, setAdmins] = useState<DebugAdmin[]>([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    getDebugAdminList().then(setAdmins);
  }, []);

  const handleSwitch = async (admin: DebugAdmin) => {
    if (switching) return;
    setSwitching(true);
    try {
      const result = await switchDebugAdmin(admin.email);
      if (result.success) {
        toast.success(`${admin.lastName} ${admin.firstName}に切り替えました`);
        router.refresh();
      } else {
        // デフォルトパスワードで失敗 → パスワード入力ダイアログを表示
        onPasswordRequired(admin);
      }
    } catch {
      toast.error("切り替え中にエラーが発生しました");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span>管理者切り替え</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64" sideOffset={8}>
        {admins.map((admin) => {
          const isCurrent = admin.email === currentEmail;
          return (
            <DropdownMenuItem
              key={admin.id}
              className={cn(isCurrent && "bg-accent")}
              onClick={() => handleSwitch(admin)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {admin.lastName} {admin.firstName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {admin.email}
                  </span>
                </div>
                {isCurrent && <Check className="h-4 w-4 shrink-0" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * パスワード入力ダイアログ（DropdownMenuの外にレンダリング）
 */
export function AdminSwitcherPasswordDialog({
  admin,
  open,
  onOpenChange,
}: {
  admin: DebugAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [switching, setSwitching] = useState(false);

  const close = () => {
    setPassword("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!admin || switching || !password) return;
    setSwitching(true);
    try {
      const result = await switchDebugAdmin(admin.email, password);
      if (result.success) {
        toast.success(
          `${admin.lastName} ${admin.firstName}に切り替えました`
        );
        close();
        router.refresh();
      } else {
        toast.error(result.error ?? "パスワードが正しくありません");
      }
    } catch {
      toast.error("切り替え中にエラーが発生しました");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {admin?.lastName} {admin?.firstName} に切り替え
          </DialogTitle>
          <DialogDescription>
            この管理者のパスワードを入力してください
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={switching || !password}>
            切り替え
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
