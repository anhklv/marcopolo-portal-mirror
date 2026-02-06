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

export function AdminSwitcher({ currentEmail }: AdminSwitcherProps) {
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
        toast.error(result.error ?? "切り替えに失敗しました");
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
