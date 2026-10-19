"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { AdminForTestSend } from "@/lib/types/test-send";

interface TestSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admins: AdminForTestSend[];
  selectedAdminIds: number[];
  onToggleAdmin: (adminId: number) => void;
  onSend: () => void;
  isSending: boolean;
}

export function TestSendDialog({
  open,
  onOpenChange,
  admins,
  selectedAdminIds,
  onToggleAdmin,
  onSend,
  isSending,
}: TestSendDialogProps) {
  const hasSelection = selectedAdminIds.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="bg-card" showCloseButton={!isSending}>
        <DialogHeader>
          <DialogTitle>テストメールを送信しますか？</DialogTitle>
          <DialogDescription>
            送信先の管理者を選択してください。選択した管理者にテストメールが送信されます。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] space-y-3 overflow-y-auto py-2">
          {admins.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              送信可能な管理者がいません。
            </p>
          ) : (
            admins.map((admin) => {
              const checkboxId = `test-send-admin-${admin.id}`;
              return (
                <div
                  key={admin.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={selectedAdminIds.includes(admin.id)}
                    disabled={isSending}
                    onCheckedChange={() => onToggleAdmin(admin.id)}
                  />
                  <Label
                    htmlFor={checkboxId}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="block font-medium">
                      {admin.lastName} {admin.firstName}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {admin.email}
                    </span>
                  </Label>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            キャンセル
          </Button>
          <Button
            onClick={onSend}
            disabled={!hasSelection || isSending}
          >
            {isSending ? "送信中..." : "送信する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
