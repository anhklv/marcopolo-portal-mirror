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

