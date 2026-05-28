# デバッグ管理者切り替え: パスワード対応

## 問題

- `switchDebugAdmin` が固定パスワード `rara6y` で `loginAction` を呼んでいる
- シード管理者はすべて `rara6y` でハッシュされているため問題なし
- 管理者管理画面から新規作成された管理者は任意のパスワードで登録されるため、固定パスワードでは認証が通らない

## 方針

**デフォルトパスワード + パスワード入力ダイアログ（フォールバック）**

- まず固定パスワード `rara6y` で試行（シード管理者はワンクリック維持）
- 失敗した場合のみパスワード入力ダイアログを表示
- 開発用機能なのでシンプルに

## 変更対象

### 1. `lib/actions/debug.ts`

- `switchDebugAdmin(email, password?)` にオプショナルな `password` 引数を追加
- 指定されればそれを使用、未指定なら `DEBUG_PASSWORD` を使用

### 2. `components/debug/admin-switcher.tsx`

- `handleSwitch`: まずデフォルトで試行 → 失敗時にパスワード入力ダイアログを表示
- `handlePasswordSubmit`: 入力されたパスワードで再試行
- `Dialog` でパスワード入力UI（対象管理者名を表示）
- Radix UIのDropdownMenu内でDialogを使う際、DropdownMenuの外にDialogをレンダリングする

### 変更不要

- `lib/actions/auth.ts` - loginActionはそのまま
- `lib/auth/auth.ts` - 認証ロジックは変更不要

## 注意点

- DropdownMenu内でDialogを開く場合、DropdownMenuが閉じた時にDialogも閉じる問題あり → Dialogを状態管理で外にレンダリング
