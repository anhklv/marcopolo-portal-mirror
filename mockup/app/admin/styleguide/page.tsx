"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { DatePickerWithInput } from "@/components/ui/date-picker-with-input";
import { toast } from "sonner";
import { useState } from "react";

export default function StyleGuidePage() {
  const [date, setDate] = useState<Date>();

  return (
    <div className="space-y-12">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">スタイルガイド</h1>
        <p className="text-sm text-muted-foreground">
          UI コンポーネントとタイポグラフィの基準を定義するページです。新しいページを作る際はここを参照してください。
        </p>
      </div>

      {/* ============================== */}
      {/* タイポグラフィ */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">タイポグラフィ</h2>
          <Separator className="mt-2" />
        </div>

        <div className="rounded-lg border bg-white p-6 space-y-6">
          {/* ページタイトル */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-2xl font-bold tracking-tight（ページタイトル / h1）
              </p>
              <p className="text-2xl font-bold tracking-tight">
                ページタイトル — 24px
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: 各ページの最上部</p>
          </div>

          <Separator />

          {/* セクション見出し h2 */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-lg font-semibold（セクション見出し / h2）
              </p>
              <p className="text-lg font-semibold">
                セクション見出し — 18px
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: ページ内の大分類</p>
          </div>

          <Separator />

          {/* サブセクション見出し h3 */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-base font-semibold（サブセクション見出し / h3）
              </p>
              <p className="text-base font-semibold">
                サブセクション見出し — 16px
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: カード内のグループ見出し</p>
          </div>

          <Separator />

          {/* CardTitle */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                CardTitle コンポーネント
              </p>
              <CardTitle>カードタイトル</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">用途: カードのタイトル</p>
          </div>

          <Separator />

          {/* フォーム内小見出し */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                Label className="text-base font-medium"
              </p>
              <Label className="text-base font-medium">フォーム内小見出し</Label>
            </div>
            <p className="text-xs text-muted-foreground">用途: フォーム内のグルーピング見出し</p>
          </div>

          <Separator />

          {/* 本文 */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-base（本文テキスト / ベースサイズ）
              </p>
              <p className="text-base">
                本文テキスト — 16px。管理画面のすべてのテキストはこのサイズを基準にします。
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: テーブル、フォーム入力値、一般テキスト</p>
          </div>

          <Separator />

          {/* ラベル */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-base font-medium（ラベル）
              </p>
              <p className="text-base font-medium">
                ラベルテキスト — 16px medium
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: フォームラベル、項目名</p>
          </div>

          <Separator />

          {/* 説明・補足 */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-sm text-muted-foreground（説明・補足テキスト）
              </p>
              <p className="text-sm text-muted-foreground">
                説明・補足テキスト — 14px muted
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: カード説明、ヘルプテキスト</p>
          </div>

          <Separator />

          {/* 小さい補足 */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-xs text-muted-foreground（小さい補足）
              </p>
              <p className="text-xs text-muted-foreground">
                小さい補足テキスト — 12px muted
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: バリデーション、日付、件数</p>
          </div>

          <Separator />

          {/* 強調データ */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                text-base font-semibold（強調データ）
              </p>
              <p className="text-base">
                件数: <span className="font-semibold text-foreground">42</span>件
              </p>
            </div>
            <p className="text-xs text-muted-foreground">用途: 数値や重要データの強調表示</p>
          </div>

          <Separator />

          {/* バッジ */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">
                Badge + text-xs px-2 py-0.5
              </p>
              <Badge variant="default" className="text-xs px-2 py-0.5">バッジ</Badge>
            </div>
            <p className="text-xs text-muted-foreground">用途: ステータス、カテゴリ表示（12px）</p>
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* 色 */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">色</h2>
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
      {/* ボタン */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">ボタン</h2>
          <Separator className="mt-2" />
        </div>

        <div className="rounded-lg border bg-white p-6 space-y-6">
          {/* バリアント */}
          <div className="space-y-3">
            <p className="text-sm font-medium">バリアント</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>
                <Plus className="h-4 w-4" />
                Default
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Outline
              </Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Destructive
              </Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <Separator />

          {/* サイズ */}
          <div className="space-y-3">
            <p className="text-sm font-medium">サイズ</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* 使い分けルール */}
          <div className="space-y-2">
            <p className="text-sm font-medium">使い分けルール</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>主要アクション: <span className="font-mono text-xs">default</span></li>
              <li>一覧ページの新規登録: <span className="font-mono text-xs">default</span> + アイコン</li>
              <li>テーブル行内の操作: <span className="font-mono text-xs">outline</span> + <span className="font-mono text-xs">size=&quot;sm&quot;</span></li>
              <li>削除・危険操作: <span className="font-mono text-xs">destructive</span></li>
              <li>ダウンロード: <span className="font-mono text-xs">outline</span> + Download アイコン</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================== */}
      {/* バッジ */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">バッジ</h2>
          <Separator className="mt-2" />
        </div>

        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            バッジは常に <span className="font-mono">text-xs px-2 py-0.5</span> を使用します。
          </p>
        </div>
      </section>

      {/* ============================== */}
      {/* フォーム */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">フォーム</h2>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>フォームのレイアウト例です。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* テキスト入力 */}
            <div className="grid gap-2">
              <Label htmlFor="sg-name">
                氏名 <span className="text-destructive">*</span>
              </Label>
              <Input id="sg-name" placeholder="山田 太郎" />
              <p className="text-xs text-muted-foreground">
                姓と名の間にスペースを入れてください。
              </p>
            </div>

            {/* メール */}
            <div className="grid gap-2">
              <Label htmlFor="sg-email">
                メールアドレス <span className="text-destructive">*</span>
              </Label>
              <Input id="sg-email" type="email" placeholder="taro@example.com" />
            </div>

            {/* セレクト */}
            <div className="grid gap-2">
              <Label htmlFor="sg-role">役割</Label>
              <Select>
                <SelectTrigger id="sg-role">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理者</SelectItem>
                  <SelectItem value="member">会員</SelectItem>
                  <SelectItem value="observer">オブザーバー</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* チェックボックス */}
            <div className="space-y-3">
              <Label>オプション</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="sg-check1" />
                <Label htmlFor="sg-check1" className="cursor-pointer">
                  メール通知を受け取る
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="sg-check2" />
                <Label htmlFor="sg-check2" className="cursor-pointer">
                  プレミアム会員として登録
                </Label>
              </div>
            </div>

            {/* テキストエリア */}
            <div className="grid gap-2">
              <Label htmlFor="sg-note">備考</Label>
              <Textarea id="sg-note" placeholder="自由に入力してください" rows={3} />
            </div>

            {/* ボタン */}
            <div className="flex justify-end gap-3">
              <Button variant="outline">キャンセル</Button>
              <Button>保存</Button>
            </div>
          </CardContent>
        </Card>

        {/* フォームルール */}
        <div className="rounded-lg border bg-white p-6 space-y-2">
          <p className="text-sm font-medium">フォームのルール</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>ラベル: <span className="font-mono text-xs">Label</span> コンポーネント（text-base font-medium）</li>
            <li>必須マーク: <span className="font-mono text-xs">&lt;span className=&quot;text-destructive&quot;&gt;*&lt;/span&gt;</span></li>
            <li>ヘルプテキスト: <span className="font-mono text-xs">text-xs text-muted-foreground</span></li>
            <li>入力フィールド間の余白: <span className="font-mono text-xs">space-y-6</span></li>
            <li>ラベルとフィールドの間: <span className="font-mono text-xs">grid gap-2</span></li>
          </ul>
        </div>
      </section>

      {/* ============================== */}
      {/* テーブル */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">テーブル（一覧ページ）</h2>
          <Separator className="mt-2" />
        </div>

        {/* 一覧ヘッダー例 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">一覧ページ例</h1>
              <p className="text-sm text-muted-foreground">
                ページの説明テキストはこのスタイルで記述します。
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4" />
              新規登録
            </Button>
          </div>

          {/* 検索バー */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="検索..."
                className="pl-9 h-10"
                readOnly
              />
            </div>
          </div>

          {/* 件数表示 */}
          <div className="flex justify-end">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">3</span>件
            </div>
          </div>

          {/* テーブル */}
          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>区分</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">C001</TableCell>
                  <TableCell>山田 太郎</TableCell>
                  <TableCell>株式会社サンプル</TableCell>
                  <TableCell>
                    <Badge variant="default">会員</Badge>
                  </TableCell>
                  <TableCell>2024/01/15</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">編集</Button>
                  </TableCell>
                </TableRow>
                <TableRow className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">C002</TableCell>
                  <TableCell>鈴木 花子</TableCell>
                  <TableCell>テスト株式会社</TableCell>
                  <TableCell>
                    <Badge variant="default">スポンサー</Badge>
                  </TableCell>
                  <TableCell>2024/02/20</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">編集</Button>
                  </TableCell>
                </TableRow>
                <TableRow className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">C003</TableCell>
                  <TableCell>佐藤 一郎</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>
                    <Badge variant="secondary">非会員</Badge>
                  </TableCell>
                  <TableCell>2024/03/10</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">編集</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* テーブルルール */}
        <div className="rounded-lg border bg-white p-6 space-y-2">
          <p className="text-sm font-medium">テーブルのルール</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>テーブル外枠: <span className="font-mono text-xs">rounded-lg border bg-white</span></li>
            <li>クリック可能な行: <span className="font-mono text-xs">cursor-pointer hover:bg-gray-50</span></li>
            <li>ID列: <span className="font-mono text-xs">font-medium</span></li>
            <li>操作列: <span className="font-mono text-xs">text-right</span> + Button outline sm</li>
            <li>件数表示: ページタイトルとテーブルの間に配置</li>
          </ul>
        </div>
      </section>

      {/* ============================== */}
      {/* 詳細ページ */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">詳細ページ</h2>
          <Separator className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>詳細ページのカードレイアウト例です。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">氏名</p>
                <p className="text-base">山田 太郎</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">会社名</p>
                <p className="text-base">株式会社サンプル</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">メールアドレス</p>
                <p className="text-base">taro@example.com</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">登録日</p>
                <p className="text-base">2024/01/15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 詳細ページルール */}
        <div className="rounded-lg border bg-white p-6 space-y-2">
          <p className="text-sm font-medium">詳細ページのルール</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>項目名: <span className="font-mono text-xs">text-sm font-medium text-muted-foreground</span></li>
            <li>項目値: <span className="font-mono text-xs">text-base</span></li>
            <li>項目名と値の間: <span className="font-mono text-xs">space-y-1 (4px)</span></li>
            <li>グリッド: <span className="font-mono text-xs">grid grid-cols-2 gap-6 (24px)</span></li>
          </ul>
        </div>
      </section>

      {/* ============================== */}
      {/* スペーシング */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">スペーシング</h2>
          <Separator className="mt-2" />
        </div>

        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>要素</TableHead>
                <TableHead>Tailwind クラス</TableHead>
                <TableHead>用途</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">ページ全体</TableCell>
                <TableCell className="font-mono text-xs">space-y-6</TableCell>
                <TableCell className="text-muted-foreground">ページ内のセクション間</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">メインコンテンツ</TableCell>
                <TableCell className="font-mono text-xs">p-8</TableCell>
                <TableCell className="text-muted-foreground">レイアウトのメイン領域パディング</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">カード内</TableCell>
                <TableCell className="font-mono text-xs">space-y-6（CardContent内）</TableCell>
                <TableCell className="text-muted-foreground">フォームフィールド間</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ラベル-フィールド間</TableCell>
                <TableCell className="font-mono text-xs">grid gap-2</TableCell>
                <TableCell className="text-muted-foreground">ラベルと入力フィールドの間</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ボタン間</TableCell>
                <TableCell className="font-mono text-xs">gap-3</TableCell>
                <TableCell className="text-muted-foreground">複数ボタンの間隔</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">検索バー高さ</TableCell>
                <TableCell className="font-mono text-xs">h-10</TableCell>
                <TableCell className="text-muted-foreground">検索バーとフィルタボタンの高さ</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ============================== */}
      {/* UI コンポーネント（その他） */}
      {/* ============================== */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">UI コンポーネント（その他）</h2>
          <Separator className="mt-2" />
        </div>

        {/* DatePicker */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">日付選択</h3>
          <div className="rounded-lg border bg-white p-6">
            <div className="w-[240px]">
              <DatePickerWithInput date={date} setDate={setDate} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-mono">DatePickerWithInput</span> コンポーネントを使用
            </p>
          </div>
        </div>

        <Separator />

        {/* Toast */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">トースト通知</h3>
          <div className="rounded-lg border bg-white p-6 flex gap-4">
            <Button onClick={() => toast.success("保存しました")}>
              Success
            </Button>
            <Button variant="destructive" onClick={() => toast.error("エラーが発生しました")}>
              Error
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">sonner</span> の <span className="font-mono">toast</span> 関数を使用
          </p>
        </div>
      </section>
    </div>
  );
}
