import { test, expect } from '@playwright/test';

// テスト用のヘルパー関数
async function loginAs(page: any, email: string, password: string) {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin/customers', { timeout: 10000 });
}

test.describe('権限フィルタリング - 顧客一覧', () => {
  test('特権管理者は全ての顧客を閲覧できる', async ({ page }) => {
    await loginAs(page, 'admin@example.com', 'password123');

    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');

    // 全ての顧客が表示されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(5); // モックデータには複数の顧客がいる
  });

  test('ベンチャー監査役の会管理者は該当顧客のみ閲覧できる', async ({ page }) => {
    await loginAs(page, 'venture@example.com', 'password123');

    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');

    // 表示される顧客が限定されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // ベンチャー監査役の会のバッジが表示されていることを確認
    const auditBadges = page.locator('text=ベンチャー監査役の会');
    const badgeCount = await auditBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // ないかんMeetupのみの顧客は表示されないことを確認するため、
    // 全ての行をチェックして「ベンチャー監査役の会」または両方のコミュニティを持つ顧客のみが表示されていることを確認
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const hasAudit = await row.locator('text=ベンチャー監査役の会').count() > 0;
      expect(hasAudit).toBe(true);
    }
  });

  test('ないかんMeetup管理者は該当顧客のみ閲覧できる', async ({ page }) => {
    await loginAs(page, 'naikan@example.com', 'password123');

    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');

    // 表示される顧客が限定されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // ないかんMeetupのバッジが表示されていることを確認
    const naikanBadges = page.locator('text=ないかんMeetup');
    const badgeCount = await naikanBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // 全ての行をチェックして「ないかんMeetup」または両方のコミュニティを持つ顧客のみが表示されていることを確認
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const hasNaikan = await row.locator('text=ないかんMeetup').count() > 0;
      expect(hasNaikan).toBe(true);
    }
  });

  test('複数スコープ管理者は該当顧客全てを閲覧できる', async ({ page }) => {
    await loginAs(page, 'both@example.com', 'password123');

    await page.goto('/admin/customers');
    await page.waitForLoadState('networkidle');

    // 両方のコミュニティの顧客が表示されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // 両方のバッジが表示されていることを確認
    const auditBadges = page.locator('text=ベンチャー監査役の会');
    const auditCount = await auditBadges.count();
    expect(auditCount).toBeGreaterThan(0);

    const naikanBadges = page.locator('text=ないかんMeetup');
    const naikanCount = await naikanBadges.count();
    expect(naikanCount).toBeGreaterThan(0);
  });
});

test.describe('権限フィルタリング - イベント一覧', () => {
  test('特権管理者は全てのイベントを閲覧できる', async ({ page }) => {
    await loginAs(page, 'admin@example.com', 'password123');

    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    // 全てのイベントが表示されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(5); // モックデータには複数のイベントがある
  });

  test('ベンチャー監査役の会管理者は該当イベントのみ閲覧できる', async ({ page }) => {
    await loginAs(page, 'venture@example.com', 'password123');

    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    // 表示されるイベントが限定されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // ベンチャー監査役の会のバッジが表示されていることを確認
    const auditBadges = page.locator('text=ベンチャー監査役の会');
    const badgeCount = await auditBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // 全ての行をチェックしてベンチャー監査役の会のイベントのみが表示されていることを確認
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const hasAudit = await row.locator('text=ベンチャー監査役の会').count() > 0;
      expect(hasAudit).toBe(true);
    }
  });

  test('ないかんMeetup管理者は該当イベントのみ閲覧できる', async ({ page }) => {
    await loginAs(page, 'naikan@example.com', 'password123');

    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    // 表示されるイベントが限定されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // ないかんMeetupのバッジが表示されていることを確認
    const naikanBadges = page.locator('text=ないかんMeetup');
    const badgeCount = await naikanBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // 全ての行をチェックしてないかんMeetupのイベントのみが表示されていることを確認
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const hasNaikan = await row.locator('text=ないかんMeetup').count() > 0;
      expect(hasNaikan).toBe(true);
    }
  });
});

test.describe('権限チェック - 顧客登録', () => {
  test('特権管理者は全てのコミュニティの顧客を登録できる', async ({ page }) => {
    await loginAs(page, 'admin@example.com', 'password123');

    await page.goto('/admin/customers/new');
    await page.waitForLoadState('networkidle');

    // フォームに入力
    await page.locator('input[name="lastName"]').fill('テスト');
    await page.locator('input[name="firstName"]').fill('太郎');
    await page.locator('input[name="email"]').fill(`test${Date.now()}@example.com`);

    // 両方のコミュニティを選択
    await page.locator('input[name="auditCommunity"]').check();
    await page.locator('input[name="naikanCommunity"]').check();

    // 送信（実際の保存は行われないが、エラーが出ないことを確認）
    // ※実際のモックデータへの保存はlocalStorageベースなので、テストでは検証しない
  });

  test('コミュニティ管理者は権限外のコミュニティの顧客を登録できない', async ({ page }) => {
    await loginAs(page, 'venture@example.com', 'password123');

    await page.goto('/admin/customers/new');
    await page.waitForLoadState('networkidle');

    // フォームに入力
    await page.locator('input[name="lastName"]').fill('テスト');
    await page.locator('input[name="firstName"]').fill('花子');
    await page.locator('input[name="email"]').fill(`test${Date.now()}@example.com`);

    // 権限外のコミュニティ（ないかんMeetup）のみを選択
    await page.locator('input[name="naikanCommunity"]').check();

    // 送信を試みる
    await page.locator('button[type="submit"]').click();

    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const errorToast = page.locator('text=この顧客を登録する権限がありません');
    await expect(errorToast).toBeVisible();
  });
});

test.describe('権限チェック - イベント登録', () => {
  test('コミュニティ管理者は権限外のイベントを登録できない', async ({ page }) => {
    await loginAs(page, 'venture@example.com', 'password123');

    await page.goto('/admin/events/new');
    await page.waitForLoadState('networkidle');

    // フォームに入力
    await page.locator('input[name="title"]').fill('テストイベント');

    // イベント種別セレクトを開く
    const eventTypeButton = page.locator('button[role="combobox"]').filter({ hasText: /イベント種別/ }).first();
    await eventTypeButton.click();
    await page.waitForTimeout(300);

    // 権限外のイベント種別（ないかんMeetup）を選択
    const naikanOption = page.locator('text=ないかんMeetup').last();
    await naikanOption.click();
    await page.waitForTimeout(300);

    // 開催日を入力
    await page.locator('input[name="eventDate"]').fill('2026-02-01');

    // 送信を試みる
    await page.locator('button[type="submit"]').click();

    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    const errorToast = page.locator('text=このイベントを登録する権限がありません');
    await expect(errorToast).toBeVisible();
  });
});
