import { test, expect } from '@playwright/test';

test('トップページが/adminにリダイレクトする', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForURL('**/admin');
  // リダイレクト後、最終的に/adminページが200を返すことを確認
  expect(response?.status()).toBe(200);
  expect(page.url()).toContain('/admin');
});

test('ダッシュボードが200を返す', async ({ page }) => {
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(200);
});

test('顧客一覧が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/customers');
  expect(response?.status()).toBe(200);
});

test('顧客新規登録が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/customers/new');
  expect(response?.status()).toBe(200);
});

test('顧客詳細が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/customers/C001');
  expect(response?.status()).toBe(200);
});

test('顧客編集が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/customers/C001/edit');
  expect(response?.status()).toBe(200);
});

test('イベント一覧が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events');
  expect(response?.status()).toBe(200);
});

test('イベント作成が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/new');
  expect(response?.status()).toBe(200);
});

test('イベント詳細が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001');
  expect(response?.status()).toBe(200);
});

test('イベント詳細の詳細タブが200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001?tab=detail');
  expect(response?.status()).toBe(200);
});

test('イベント詳細のアンケート結果タブが200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001?tab=survey');
  expect(response?.status()).toBe(200);
});

test('イベント編集が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001/edit');
  expect(response?.status()).toBe(200);
});

test('イベント招待が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001/invite');
  expect(response?.status()).toBe(200);
});

test('イベントリマインダーが200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001/remind');
  expect(response?.status()).toBe(200);
});

test('アンケート一覧が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001/survey');
  expect(response?.status()).toBe(200);
});

test('アンケート作成が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001/survey/create');
  expect(response?.status()).toBe(200);
});

test('アンケート結果が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E001/survey/results');
  expect(response?.status()).toBe(200);
});

test('イベント参加登録が200を返す', async ({ page }) => {
  const response = await page.goto('/events/E001/rsvp');
  expect(response?.status()).toBe(200);
});

test('アンケート回答が200を返す', async ({ page }) => {
  const response = await page.goto('/events/E006/survey/survey-c001-sur006-token1');
  expect(response?.status()).toBe(200);
});

test('イベント参加登録（トークン付き）が200を返す', async ({ page }) => {
  const response = await page.goto('/events/E001/rsvp?token=demo-token');
  expect(response?.status()).toBe(200);
});

test('アンケート回答（会員向けデモトークン）が200を返す', async ({ page }) => {
  const response = await page.goto('/events/E001/survey/demo-token');
  expect(response?.status()).toBe(200);
});

test('アンケート回答（非会員向けデモトークン）が200を返す', async ({ page }) => {
  const response = await page.goto('/events/E001/survey/demo-token-nonmember');
  expect(response?.status()).toBe(200);
});

test('ベンチャー監査役協会のイベントのアンケート回答（デモトークン）が200を返す', async ({ page }) => {
  const response = await page.goto('/events/E001/survey/demo-token');
  expect(response?.status()).toBe(200);
});

test('ないかんMeetupのイベント詳細が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E002');
  expect(response?.status()).toBe(200);
});

test('その他のイベント詳細が200を返す', async ({ page }) => {
  const response = await page.goto('/admin/events/E003');
  expect(response?.status()).toBe(200);
});

test('顧客一覧のフィルタ機能が動作する', async ({ page }) => {
  await page.goto('/admin/customers');
  await page.waitForLoadState('networkidle');

  // 初期状態でテーブルにデータが表示されていることを確認
  const initialRows = page.locator('tbody tr');
  const initialCount = await initialRows.count();
  expect(initialCount).toBeGreaterThan(0);

  // 検索キーワードフィルタ
  const searchInput = page.locator('input[type="search"][placeholder*="名前"]');
  await searchInput.fill('山田');
  await page.waitForTimeout(500); // フィルタリングの待機
  const keywordFilteredRows = page.locator('tbody tr');
  const keywordFilteredCount = await keywordFilteredRows.count();
  expect(keywordFilteredCount).toBeGreaterThan(0);
  expect(keywordFilteredCount).toBeLessThanOrEqual(initialCount);

  // 検索をクリア
  await searchInput.clear();
  await page.waitForTimeout(500);

  // 社団法人フィルタ（ベンチャー監査役協会）
  const filterButton = page.locator('button').filter({ hasText: '社団法人' }).first();
  await filterButton.click();
  await page.waitForTimeout(300);
  
  // ベンチャー監査役協会のチェックボックスをクリック
  const auditCheckbox = page.locator('#org-audit');
  await auditCheckbox.click();
  await page.waitForTimeout(500);
  
  // フィルタが適用されていることを確認
  const orgFilteredRows = page.locator('tbody tr');
  const orgFilteredCount = await orgFilteredRows.count();
  expect(orgFilteredCount).toBeGreaterThan(0);
  expect(orgFilteredCount).toBeLessThanOrEqual(initialCount);

  // 会員区分フィルタが表示されていることを確認（社団法人を選択した場合のみ表示）
  // Popover内の「会員区分」ラベルを確認
  const memberCategoryLabel = page.locator('[role="dialog"] label:has-text("会員区分")');
  await expect(memberCategoryLabel).toBeVisible();

  // 会員区分の「会員」を選択
  const memberCheckbox = page.locator('#member-member');
  await memberCheckbox.click();
  await page.waitForTimeout(500);

  // Popoverを閉じる
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // ステータスフィルタ（デフォルトで「アクティブ」が選択されている）
  // ステータスボタンをクリック（「アクティブ」と表示されている）
  const statusButton = page.locator('button').filter({ hasText: /^(ステータス|アクティブ|非アクティブ)/ }).first();
  await statusButton.click();
  await page.waitForTimeout(300);
  
  // 非アクティブの項目をクリック（div全体がクリック可能）
  const inactiveItem = page.locator('div').filter({ hasText: '非アクティブ' }).first();
  await inactiveItem.click();
  await page.waitForTimeout(500);
  
  // ステータスフィルタが適用されていることを確認（アクティブと非アクティブの両方が選択されている）
  const statusFilteredRows = page.locator('tbody tr');
  const statusFilteredCount = await statusFilteredRows.count();
  expect(statusFilteredCount).toBeGreaterThan(0);
  
  // アクティブの項目をクリックして外し、非アクティブのみにする
  const activeItem = page.locator('div').filter({ hasText: 'アクティブ' }).first();
  await activeItem.click();
  await page.waitForTimeout(500);
  
  // 非アクティブのみのフィルタが適用されていることを確認
  const inactiveOnlyRows = page.locator('tbody tr');
  const inactiveOnlyCount = await inactiveOnlyRows.count();
  expect(inactiveOnlyCount).toBeGreaterThan(0);
  
  // Popoverを閉じる
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

