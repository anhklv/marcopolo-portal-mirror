"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * ActionButton - フォームの決定ボタン用コンポーネント
 * 
 * フォームの送信、次へ、戻る、キャンセルなどのアクションボタンに使用します。
 * 統一されたサイズ（min-w-32 h-11）を提供します。
 * 
 * @example
 * // デフォルト（primary）ボタン
 * <ActionButton>登録</ActionButton>
 * 
 * // outlineバリアント（キャンセル、戻るなど）
 * <ActionButton variant="outline">キャンセル</ActionButton>
 * 
 * // その他のButtonのプロパティも使用可能
 * <ActionButton variant="destructive">削除</ActionButton>
 * <ActionButton asChild>
 *   <Link href="/">リンク</Link>
 * </ActionButton>
 */
interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

function ActionButton({
  children,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <Button
      className={cn("min-w-32 h-11 cursor-pointer", className)}
      {...props}
    >
      {children}
    </Button>
  )
}

export { ActionButton }
