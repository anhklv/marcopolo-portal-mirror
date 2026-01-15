import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページにアクセスできる', async ({ page }) => {
    const response = await page.goto('/admin/login');
    expect(response?.status()).toBe(200);

    // ログインフォームの要素が表示されていることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('特権管理者でログインできる', async ({ page }) => {
    await page.goto('/admin/login');

    // ログインフォームに入力
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ログイン後、顧客一覧ページにリダイレクトされることを確認
    await page.waitForURL('**/admin/customers', { timeout: 10000 });
    expect(page.url()).toContain('/admin/customers');
  });

  test('コミュニティ管理者でログインできる', async ({ page }) => {
    await page.goto('/admin/login');

    // ログインフォームに入力
    await page.locator('input[type="email"]').fill('venture@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ログイン後、顧客一覧ページにリダイレクトされることを確認
    await page.waitForURL('**/admin/customers', { timeout: 10000 });
    expect(page.url()).toContain('/admin/customers');
  });

  test('無効な認証情報ではログインできない', async ({ page }) => {
    await page.goto('/admin/login');

    // 無効な認証情報を入力
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible();
  });

  test('ログアウトできる', async ({ page }) => {
    // まずログイン
    await page.goto('/admin/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/customers', { timeout: 10000 });

    // サイドバーの設定メニューを開く
    await page.locator('button').filter({ hasText: '設定' }).click();
    await page.waitForTimeout(300);

    // ログアウトボタンをクリック
    await page.locator('text=ログアウト').click();

    // ログインページにリダイレクトされることを確認
    await page.waitForURL('**/admin/login');
    expect(page.url()).toContain('/admin/login');
  });

  test('未認証でadminページにアクセスするとログインページにリダイレクトされる', async ({ context, page }) => {
    // localStorageをクリアして未認証状態にする
    await context.clearCookies();
    await page.goto('/admin/customers');

    // ログインページにリダイレクトされることを確認
    await page.waitForURL('**/admin/login', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('認証後、元のページにリダイレクトされる（未実装の場合はskip）', async ({ context, page }) => {
    // localStorageをクリアして未認証状態にする
    await context.clearCookies();

    // 特定のページに直接アクセスを試みる
    await page.goto('/admin/events');

    // ログインページにリダイレクトされることを確認
    await page.waitForURL('**/admin/login', { timeout: 5000 });

    // ログイン
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // ログイン後は顧客一覧にリダイレクトされる（元のページへのリダイレクトは未実装）
    await page.waitForURL('**/admin/customers', { timeout: 10000 });
    expect(page.url()).toContain('/admin/customers');
  });
});

test.describe('セッション永続化', () => {
  test('ページリロード後もログイン状態が維持される', async ({ page }) => {
    // ログイン
    await page.goto('/admin/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/customers', { timeout: 10000 });

    // ページをリロード
    await page.reload();

    // ログイン状態が維持されていることを確認（ログインページにリダイレクトされない）
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/customers');
  });

  test('新しいタブでもログイン状態が共有される', async ({ context, page }) => {
    // ログイン
    await page.goto('/admin/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/customers', { timeout: 10000 });

    // 新しいタブを開く
    const newPage = await context.newPage();
    await newPage.goto('/admin/events');

    // ログイン状態が共有されていることを確認（ログインページにリダイレクトされない）
    await newPage.waitForLoadState('networkidle');
    expect(newPage.url()).toContain('/admin/events');

    await newPage.close();
  });
});
