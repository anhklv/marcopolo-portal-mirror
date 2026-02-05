"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { FormField } from "@/components/ui/form-field"
import { Stack } from "@/components/ui/stack"
import { SectionHeading } from "@/components/ui/section-heading"
import { PageHeader } from "@/components/ui/page-header"
import { DataItem } from "@/components/ui/data-item"
import { CheckboxItem } from "@/components/ui/checkbox-item"
import { RadioItem } from "@/components/ui/radio-item"
import { RadioGroup } from "@/components/ui/radio-group"
import { ActionButton } from "@/components/ui/action-button"
import { RSVP_STATUS_CONFIG, EVENT_STATUS_CONFIG, type RsvpStatusConfigKey, type EventStatusConfigKey } from "@/lib/constants/event"
import { USER_ROLE_CONFIG, type UserRoleConfigKey } from "@/lib/constants/customer"
import { toast } from "sonner"
import { Palette, LayoutGrid, FormInput, Package, FileCode, Type, Sparkles, Box, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// コードブロック表示コンポーネント
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-slate-900 text-slate-50 p-4 rounded-md text-sm overflow-x-auto">
      <code>{children}</code>
    </pre>
  )
}

// サンプル表示コンポーネント
function Example({
  children,
  code,
}: {
  children: React.ReactNode
  code: string
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 bg-white">{children}</div>
      <div className="border-t">
        <details className="group">
          <summary className="px-4 py-2 bg-slate-100 cursor-pointer text-sm font-medium hover:bg-slate-200">
            コードを表示
          </summary>
          <CodeBlock>{code}</CodeBlock>
        </details>
      </div>
    </div>
  )
}

export default function StyleguidePage() {
  const [sampleSelect, setSampleSelect] = useState("")
  const [sampleCheckbox, setSampleCheckbox] = useState(false)
  const [sampleRadio, setSampleRadio] = useState("")

  return (
    <div className="space-y-12">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">スタイルガイド</h1>
        <p className="text-sm text-muted-foreground">
          コピペで使えるコンポーネント集
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            独自コンポーネント
          </span>
          <span className="flex items-center gap-1">
            <Box className="h-3 w-3 text-slate-500" />
            shadcn/ui
          </span>
        </div>
      </div>

      {/* ============================== */}
      {/* 色 */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            色
          </h2>
          <Separator className="mt-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-foreground" />
            <p className="text-sm font-medium">foreground</p>
            <p className="text-xs text-muted-foreground">メインテキスト</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-muted-foreground" />
            <p className="text-sm font-medium">muted-foreground</p>
            <p className="text-xs text-muted-foreground">補足テキスト</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-primary" />
            <p className="text-sm font-medium">primary</p>
            <p className="text-xs text-muted-foreground">ボタン、リンク</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-destructive" />
            <p className="text-sm font-medium">destructive</p>
            <p className="text-xs text-muted-foreground">削除、エラー</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg border bg-background" />
            <p className="text-sm font-medium">background</p>
            <p className="text-xs text-muted-foreground">ページ背景</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-muted" />
            <p className="text-sm font-medium">muted</p>
            <p className="text-xs text-muted-foreground">セカンダリ背景</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-accent" />
            <p className="text-sm font-medium">accent</p>
            <p className="text-xs text-muted-foreground">ホバー背景</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg border bg-card" />
            <p className="text-sm font-medium">card</p>
            <p className="text-xs text-muted-foreground">カード背景</p>
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* タイポグラフィ */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Type className="h-5 w-5" />
            タイポグラフィ
          </h2>
          <Separator className="mt-2" />
        </div>

        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight">ページタイトル</p>
            <p className="text-xs text-muted-foreground font-mono">text-2xl font-bold tracking-tight</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-lg font-semibold">セクション見出し</p>
            <p className="text-xs text-muted-foreground font-mono">text-lg font-semibold</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-base font-semibold">サブ見出し</p>
            <p className="text-xs text-muted-foreground font-mono">text-base font-semibold</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm font-medium">ラベル</p>
            <p className="text-xs text-muted-foreground font-mono">text-sm font-medium（Labelコンポーネント）</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-base">本文テキスト</p>
            <p className="text-xs text-muted-foreground font-mono">text-base</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">説明・補足テキスト</p>
            <p className="text-xs text-muted-foreground font-mono">text-sm text-muted-foreground</p>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">小さい補足（日付、件数等）</p>
            <p className="text-xs text-muted-foreground font-mono">text-xs text-muted-foreground</p>
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* レイアウト */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            レイアウト
          </h2>
          <Separator className="mt-2" />
        </div>

        {/* Stack */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Stack
          </h3>
          <p className="text-sm text-muted-foreground">
            縦積みレイアウト。gap で間隔を指定。
          </p>

          <div className="text-sm rounded-lg border bg-white p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">gap</th>
                  <th className="text-left py-2">値</th>
                  <th className="text-left py-2">用途</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2"><code>xs</code></td>
                  <td className="py-2">4px</td>
                  <td className="py-2 text-muted-foreground">詳細項目内</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>sm</code></td>
                  <td className="py-2">8px</td>
                  <td className="py-2 text-muted-foreground">Label-Input間</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>md</code></td>
                  <td className="py-2">16px</td>
                  <td className="py-2 text-muted-foreground">中間（デフォルト）</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>lg</code></td>
                  <td className="py-2">24px</td>
                  <td className="py-2 text-muted-foreground">フォーム項目間</td>
                </tr>
                <tr>
                  <td className="py-2"><code>xl</code></td>
                  <td className="py-2">32px</td>
                  <td className="py-2 text-muted-foreground">セクション間</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Example
            code={`<Stack gap="lg">
  <div className="h-12 w-full bg-muted rounded" />
  <div className="h-12 w-full bg-muted rounded" />
</Stack>`}
          >
            <Stack gap="lg">
              <div className="h-12 w-full bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
            </Stack>
          </Example>
        </div>

        <Separator />

        {/* SectionHeading */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            SectionHeading
          </h3>
          <p className="text-sm text-muted-foreground">
            セクション見出し。h2 + Separator。
          </p>

          <Example code={`<SectionHeading>プロフィール</SectionHeading>`}>
            <SectionHeading>プロフィール</SectionHeading>
          </Example>
        </div>

        <Separator />

        {/* PageHeader */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            PageHeader
          </h3>
          <p className="text-sm text-muted-foreground">
            ページヘッダー。戻るボタン + タイトル + 説明。
          </p>

          <Example
            code={`<PageHeader
  backHref="/admin/customers"
  title="顧客登録"
  description="新しい顧客情報をシステムに登録します。"
/>`}
          >
            <PageHeader
              backHref="/admin/customers"
              title="顧客登録"
              description="新しい顧客情報をシステムに登録します。"
            />
          </Example>
        </div>

        <Separator />

        {/* DataItem */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            DataItem
          </h3>
          <p className="text-sm text-muted-foreground">
            詳細表示用。ラベル + 値の組み合わせ。
          </p>

          <Example
            code={`<div className="grid grid-cols-2 gap-6">
  <DataItem label="氏名">山田 太郎</DataItem>
  <DataItem label="会社名">株式会社マルコポーロ</DataItem>
</div>`}
          >
            <div className="grid grid-cols-2 gap-6">
              <DataItem label="氏名">山田 太郎</DataItem>
              <DataItem label="会社名">株式会社マルコポーロ</DataItem>
            </div>
          </Example>
        </div>
      </section>

      {/* ============================== */}
      {/* フォーム */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FormInput className="h-5 w-5" />
            フォーム
          </h2>
          <Separator className="mt-2" />
        </div>

        {/* FormField */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            FormField
          </h3>
          <p className="text-sm text-muted-foreground">
            Label + Input + 補足テキストをまとめるコンポーネント。
          </p>

          <Example
            code={`<FormField label="姓" required>
  <Input placeholder="例: 山田" />
</FormField>`}
          >
            <FormField label="姓" required>
              <Input placeholder="例: 山田" />
            </FormField>
          </Example>

          <Example
            code={`<FormField label="メールアドレス" description="メインの連絡先として使用します">
  <Input type="email" placeholder="name@example.com" />
</FormField>`}
          >
            <FormField
              label="メールアドレス"
              description="メインの連絡先として使用します"
            >
              <Input type="email" placeholder="name@example.com" />
            </FormField>
          </Example>

          <Example
            code={`<FormField label="姓" required error="姓を入力してください">
  <Input placeholder="例: 山田" />
</FormField>`}
          >
            <FormField label="姓" required error="姓を入力してください">
              <Input placeholder="例: 山田" />
            </FormField>
          </Example>

          <Example
            code={`<FormField label="都道府県">
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="選択してください" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="tokyo">東京都</SelectItem>
    </SelectContent>
  </Select>
</FormField>`}
          >
            <FormField label="都道府県">
              <Select value={sampleSelect} onValueChange={setSampleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokyo">東京都</SelectItem>
                  <SelectItem value="osaka">大阪府</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </Example>

          <Example
            code={`<FormField label="備考">
  <Textarea placeholder="紹介者や特記事項など" />
</FormField>`}
          >
            <FormField label="備考">
              <Textarea placeholder="紹介者や特記事項など" />
            </FormField>
          </Example>
        </div>

        <Separator />

        {/* 2列グリッド */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">2列グリッド</h3>
          <p className="text-sm text-muted-foreground">
            フォームで2列表示する場合。gap-6（24px）を使用。
          </p>

          <Example
            code={`<div className="grid grid-cols-2 gap-6">
  <FormField label="姓" required>
    <Input placeholder="例: 山田" />
  </FormField>
  <FormField label="名" required>
    <Input placeholder="例: 太郎" />
  </FormField>
</div>`}
          >
            <div className="grid grid-cols-2 gap-6">
              <FormField label="姓" required>
                <Input placeholder="例: 山田" />
              </FormField>
              <FormField label="名" required>
                <Input placeholder="例: 太郎" />
              </FormField>
            </div>
          </Example>
        </div>

        <Separator />

        {/* CheckboxItem */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            CheckboxItem
          </h3>
          <p className="text-sm text-muted-foreground">
            Checkbox + Labelをまとめたコンポーネント。
          </p>

          <Example
            code={`<CheckboxItem
  id="premium"
  label="プレミアム会員"
  checked={checked}
  onCheckedChange={setChecked}
/>`}
          >
            <CheckboxItem
              id="premium"
              label="プレミアム会員"
              checked={sampleCheckbox}
              onCheckedChange={setSampleCheckbox}
            />
          </Example>

          <Example
            code={`<div className="flex items-center gap-6">
  <CheckboxItem id="audit" label="ベンチャー監査役の会" />
  <CheckboxItem id="naikan" label="ないかんMeetup" />
</div>`}
          >
            <div className="flex items-center gap-6">
              <CheckboxItem id="audit" label="ベンチャー監査役の会" />
              <CheckboxItem id="naikan" label="ないかんMeetup" />
            </div>
          </Example>
        </div>

        <Separator />

        {/* RadioItem */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            RadioItem
          </h3>
          <p className="text-sm text-muted-foreground">
            RadioGroupItem + Labelをまとめたコンポーネント。RadioGroup内で使用。
          </p>

          <Example
            code={`<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center gap-6">
    <RadioItem value="member" label="会員" />
    <RadioItem value="sponsor" label="スポンサー" />
    <RadioItem value="observer" label="オブザーバー" />
  </div>
</RadioGroup>`}
          >
            <RadioGroup value={sampleRadio} onValueChange={setSampleRadio}>
              <div className="flex items-center gap-6">
                <RadioItem value="member" label="会員" />
                <RadioItem value="sponsor" label="スポンサー" />
                <RadioItem value="observer" label="オブザーバー" />
              </div>
            </RadioGroup>
          </Example>
        </div>

        <Separator />

        {/* Input */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Box className="h-4 w-4 text-slate-500" />
            Input
          </h3>

          <Example code={`// フォーム用（デフォルト: h-10 / text-base）
<Input placeholder="例: 山田" />

// 検索・フィルター用（h-9 / text-sm）
<Input className="h-9 text-sm" placeholder="検索..." />`}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">フォーム用（h-10 / text-base）</p>
                <Input placeholder="例: 山田" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">検索・フィルター用（h-9 / text-sm）</p>
                <Input className="h-9 text-sm" placeholder="検索..." />
              </div>
            </div>
          </Example>
        </div>
      </section>

      {/* ============================== */}
      {/* 部品 */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            部品
          </h2>
          <Separator className="mt-2" />
        </div>

        {/* Button */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Box className="h-4 w-4 text-slate-500" />
            Button
          </h3>

          <div className="text-sm rounded-lg border bg-white p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">variant</th>
                  <th className="text-left py-2">用途</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2"><code>default</code></td>
                  <td className="py-2 text-muted-foreground">主要アクション（新規登録、作成など）</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>outline</code></td>
                  <td className="py-2 text-muted-foreground">副次アクション（キャンセル、CSVダウンロードなど）</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>ghost</code></td>
                  <td className="py-2 text-muted-foreground">軽いアクション（戻る、閉じるなど）</td>
                </tr>
                <tr>
                  <td className="py-2"><code>destructive</code></td>
                  <td className="py-2 text-muted-foreground">危険なアクション（削除など）</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Example
            code={`<Button variant="default">登録</Button>
<Button variant="outline">キャンセル</Button>
<Button variant="ghost">戻る</Button>
<Button variant="destructive">削除</Button>`}
          >
            <div className="flex gap-4">
              <Button variant="default">登録</Button>
              <Button variant="outline">キャンセル</Button>
              <Button variant="ghost">戻る</Button>
              <Button variant="destructive">削除</Button>
            </div>
          </Example>

          <h4 className="text-sm font-medium pt-4">Dialogを使った削除ボタン</h4>
          <p className="text-xs text-muted-foreground">
            DialogTriggerの削除ボタンは<code>variant="outline"</code>に<code>className="border-destructive text-destructive bg-white hover:bg-white hover:text-destructive"</code>を追加します。
            <br />
            モーダル内の実際の削除ボタンは<code>variant="destructive"</code>を使用します。
          </p>
          <Example
            code={`<Dialog>
  <DialogTrigger asChild>
    <Button
      variant="outline"
      className="border-destructive text-destructive bg-white hover:bg-white hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
      削除
    </Button>
  </DialogTrigger>
  <DialogContent className="bg-white">
    <DialogHeader>
      <DialogTitle>削除確認</DialogTitle>
      <DialogDescription>
        この操作は取り消せません。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        キャンセル
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        削除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
          >
            <div className="text-xs text-muted-foreground">
              ※実際の動作例はコードを参照してください
            </div>
          </Example>
        </div>

        <Separator />

        {/* ActionButton */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            ActionButton
          </h3>
          <p className="text-sm text-muted-foreground">
            フォームの決定ボタン用。min-w-32 / h-11 で押しやすいサイズ。
            <br />
            主要アクション（登録、送信など）だけでなく、副次アクション（戻る、キャンセル、テスト送信など）にも使用可。
          </p>

          <Example
            code={`// 主要アクション
<ActionButton variant="default">登録</ActionButton>
<ActionButton variant="default">送信</ActionButton>
<ActionButton variant="destructive">削除</ActionButton>

// 副次アクション
<ActionButton variant="outline">戻る</ActionButton>
<ActionButton variant="outline">キャンセル</ActionButton>
<ActionButton variant="outline">テスト送信</ActionButton>`}
          >
            <div className="space-y-4">
              <div className="flex gap-4 justify-start">
                <ActionButton variant="default">登録</ActionButton>
                <ActionButton variant="default">送信</ActionButton>
                <ActionButton variant="destructive">削除</ActionButton>
              </div>
              <div className="flex gap-4 justify-start">
                <ActionButton variant="outline">戻る</ActionButton>
                <ActionButton variant="outline">キャンセル</ActionButton>
                <ActionButton variant="outline">テスト送信</ActionButton>
              </div>
            </div>
          </Example>
        </div>

        <Separator />

        {/* Badge */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Box className="h-4 w-4 text-slate-500" />
            Badge
          </h3>

          <Example
            code={`<Badge variant="default">default</Badge>
<Badge variant="secondary">secondary</Badge>
<Badge variant="outline">outline</Badge>
<Badge variant="destructive">destructive</Badge>
<Badge variant="destructive-outline">destructive-outline</Badge>`}
          >
            <div className="flex gap-2">
              <Badge variant="default">default</Badge>
              <Badge variant="secondary">secondary</Badge>
              <Badge variant="outline">outline</Badge>
              <Badge variant="destructive">destructive</Badge>
              <Badge variant="destructive-outline">destructive-outline</Badge>
            </div>
          </Example>

          <h4 className="text-sm font-medium pt-4">コミュニティバッジ</h4>
          <Example
            code={`<Badge variant="audit">ベンチャー監査役の会</Badge>
<Badge variant="naikan">ないかんMeetup</Badge>
<Badge variant="ai">AI部会</Badge>
<Badge variant="non-member">非会員</Badge>`}
          >
            <div className="flex gap-2 flex-wrap">
              <Badge variant="audit">ベンチャー監査役の会</Badge>
              <Badge variant="naikan">ないかんMeetup</Badge>
              <Badge variant="ai">AI部会</Badge>
              <Badge variant="non-member">非会員</Badge>
            </div>
          </Example>

          <h4 className="text-sm font-medium pt-4">ステータスバッジ定義</h4>
          <Example
            code={`// 定数定義のインポート
import { USER_ROLE_CONFIG } from "@/lib/constants/customer"
import { RSVP_STATUS_CONFIG, EVENT_STATUS_CONFIG } from "@/lib/constants/event"

// --- 会員ステータスの使用例 ---
<Badge variant={USER_ROLE_CONFIG.member.variant}>
  {USER_ROLE_CONFIG.member.label}
</Badge>

// --- 参加者ステータスの使用例 ---
<Badge variant={RSVP_STATUS_CONFIG.attending.variant}>
  {RSVP_STATUS_CONFIG.attending.label}
</Badge>

// --- イベントステータスの使用例 ---
<Badge variant={EVENT_STATUS_CONFIG.open.variant}>
  {EVENT_STATUS_CONFIG.open.label}
</Badge>`}
          >
            <div className="space-y-8">
              {/* 会員ステータス */}
              <div>
                <h5 className="font-semibold mb-3">会員ステータス</h5>
                <div className="text-sm rounded-lg bg-white overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-4 w-[120px]">プレビュー</th>
                        <th className="text-left py-2 px-4">ステータス</th>
                        <th className="text-left py-2 px-4">表示テキスト</th>
                        <th className="text-left py-2 px-4">Variant</th>
                        <th className="text-left py-2 px-4">説明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(USER_ROLE_CONFIG).map(([key, config]) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="py-2 px-4">
                            <Badge variant={config.variant as any}>
                              {config.label}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">{key}</td>
                          <td className="py-2 px-4">{config.label}</td>
                          <td className="py-2 px-4"><code>{config.variant}</code></td>
                          <td className="py-2 px-4 text-muted-foreground">{config.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 参加者（RSVP）ステータス */}
              <div>
                <h5 className="font-semibold mb-3">参加者（RSVP）ステータス</h5>
                <div className="text-sm rounded-lg bg-white overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-4 w-[120px]">プレビュー</th>
                        <th className="text-left py-2 px-4">ステータス</th>
                        <th className="text-left py-2 px-4">表示テキスト</th>
                        <th className="text-left py-2 px-4">Variant</th>
                        <th className="text-left py-2 px-4">説明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(RSVP_STATUS_CONFIG).map(([key, config]) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="py-2 px-4">
                            <Badge variant={config.variant as any}>
                              {config.label}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">{key}</td>
                          <td className="py-2 px-4">{config.label}</td>
                          <td className="py-2 px-4"><code>{config.variant}</code></td>
                          <td className="py-2 px-4 text-muted-foreground">{config.description}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-2 px-4">
                          <Badge variant="outline">
                            懇親会: {`{ステータス}`}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">懇親会</td>
                        <td className="py-2 px-4">懇親会: {"{ステータス}"}</td>
                        <td className="py-2 px-4"><code>outline</code></td>
                        <td className="py-2 px-4 text-muted-foreground">懇親会の参加ステータス</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* イベントステータス */}
              <div>
                <h5 className="font-semibold mb-3">イベントステータス</h5>
                <div className="text-sm rounded-lg bg-white overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-4 w-[120px]">プレビュー</th>
                        <th className="text-left py-2 px-4">ステータス</th>
                        <th className="text-left py-2 px-4">表示テキスト</th>
                        <th className="text-left py-2 px-4">Variant</th>
                        <th className="text-left py-2 px-4">説明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(EVENT_STATUS_CONFIG).map(([key, config]) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="py-2 px-4">
                            <Badge variant={config.variant as any}>
                              {config.label}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">{key}</td>
                          <td className="py-2 px-4">{config.label}</td>
                          <td className="py-2 px-4"><code>{config.variant}</code></td>
                          <td className="py-2 px-4 text-muted-foreground">{config.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Example>
        </div>

        <Separator />

        {/* Toast */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Box className="h-4 w-4 text-slate-500" />
            Toast
          </h3>

          <Example
            code={`import { toast } from "sonner"

toast.success("保存しました")
toast.error("エラーが発生しました")`}
          >
            <div className="flex gap-4">
              <Button onClick={() => toast.success("保存しました")}>
                Success
              </Button>
              <Button variant="destructive" onClick={() => toast.error("エラーが発生しました")}>
                Error
              </Button>
            </div>
          </Example>
        </div>
      </section>

      {/* ============================== */}
      {/* Import */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Import
          </h2>
          <Separator className="mt-2" />
        </div>

        <CodeBlock>{`// レイアウトコンポーネント
import { Stack } from "@/components/ui/stack"
import { SectionHeading } from "@/components/ui/section-heading"
import { PageHeader } from "@/components/ui/page-header"
import { FormField } from "@/components/ui/form-field"
import { DataItem } from "@/components/ui/data-item"
import { CheckboxItem } from "@/components/ui/checkbox-item"
import { RadioItem } from "@/components/ui/radio-item"
import { ActionButton } from "@/components/ui/action-button"

// shadcn/ui
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Toast
import { toast } from "sonner"`}</CodeBlock>
      </section>
    </div>
  )
}
