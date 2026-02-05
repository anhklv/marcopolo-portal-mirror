import { test, expect } from '@playwright/test';

test('トップページが/admin/loginにリダイレクトする', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForURL('**/admin/login');
  // リダイレクト後、最終的に/admin/loginページが200を返すことを確認
  expect(response?.status()).toBe(200);
  expect(page.url()).toContain('/admin/login');
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

test('ベンチャー監査役の会のイベントのアンケート回答（デモトークン）が200を返す', async ({ page }) => {
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
  // ログインしてから顧客一覧へ
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin/customers', { timeout: 10000 });

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

  // コミュニティフィルタ（ベンチャー監査役の会）
  const filterButton = page.locator('button').filter({ hasText: 'コミュニティ' }).first();
  await filterButton.click();
  await page.waitForTimeout(300);
  
  // ベンチャー監査役の会のチェックボックスをクリック
  const auditCheckbox = page.locator('#org-audit');
  await auditCheckbox.click();
  await page.waitForTimeout(500);
  
  // フィルタが適用されていることを確認
  const orgFilteredRows = page.locator('tbody tr');
  const orgFilteredCount = await orgFilteredRows.count();
  expect(orgFilteredCount).toBeGreaterThan(0);
  expect(orgFilteredCount).toBeLessThanOrEqual(initialCount);

  // 会員区分フィルタが表示されていることを確認（コミュニティを選択した場合のみ表示）
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

  // 元会員を含むチェックボックス
  const formerMembersCheckbox = page.locator('#include-former-members');
  await formerMembersCheckbox.click();
  await page.waitForTimeout(500);

  // 元会員を含むフィルタが適用されていることを確認
  const formerMemberRows = page.locator('tbody tr');
  const formerMemberCount = await formerMemberRows.count();
  expect(formerMemberCount).toBeGreaterThan(0);
});
