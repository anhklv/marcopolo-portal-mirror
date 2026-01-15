import { test, expect } from '@playwright/test';

// テスト用のヘルパー関数
async function loginAsSuperAdmin(page: any) {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('admin@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin/customers', { timeout: 10000 });
}

async function loginAsCommunityAdmin(page: any) {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('venture@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin/customers', { timeout: 10000 });
}

test.describe('管理者管理 - アクセス権限', () => {
  test('特権管理者は管理者管理メニューにアクセスできる', async ({ page }) => {
    await loginAsSuperAdmin(page);

    // サイドバーの設定メニューを開く
    await page.locator('button').filter({ hasText: '設定' }).click();
    await page.waitForTimeout(300);

    // 管理者管理メニューが表示されていることを確認
    const adminManagementLink = page.locator('text=管理者管理');
    await expect(adminManagementLink).toBeVisible();

    // 管理者管理ページにアクセス
    await adminManagementLink.click();
    await page.waitForURL('**/admin/admins');
    expect(page.url()).toContain('/admin/admins');
  });

  test('コミュニティ管理者は管理者管理メニューにアクセスできない', async ({ page }) => {
    await loginAsCommunityAdmin(page);

    // サイドバーの設定メニューを開く
    await page.locator('button').filter({ hasText: '設定' }).click();
    await page.waitForTimeout(300);

    // 管理者管理メニューが表示されていないことを確認
    const adminManagementLink = page.locator('text=管理者管理');
    await expect(adminManagementLink).not.toBeVisible();
  });

  test('コミュニティ管理者が直接URLで管理者管理ページにアクセスしようとすると拒否される', async ({ page }) => {
    await loginAsCommunityAdmin(page);

    // 直接URLで管理者管理ページにアクセスを試みる
    await page.goto('/admin/admins');
    await page.waitForTimeout(1000);

    // 顧客一覧ページにリダイレクトされることを確認
    await page.waitForURL('**/admin/customers', { timeout: 5000 });
    expect(page.url()).toContain('/admin/customers');

    // エラーメッセージが表示されることを確認
    const errorToast = page.locator('text=この機能にアクセスする権限がありません');
    await expect(errorToast).toBeVisible();
  });
});

test.describe('管理者管理 - 一覧表示', () => {
  test('管理者一覧が表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 管理者一覧のテーブルが表示されていることを確認
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // モックデータの管理者が表示されていることを確認
    await expect(page.locator('text=管理 太郎')).toBeVisible();
    await expect(page.locator('text=監査 花子')).toBeVisible();
  });

  test('管理者一覧で検索ができる', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 初期状態の行数を取得
    const initialRows = page.locator('tbody tr');
    const initialCount = await initialRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // 検索キーワードを入力
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('監査');
    await page.waitForTimeout(500);

    // フィルタリングされた結果を確認
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 検索結果に「監査」が含まれていることを確認
    await expect(page.locator('tbody').locator('text=監査')).toBeVisible();
  });
});

test.describe('管理者管理 - 登録', () => {
  test('新規管理者登録ページにアクセスできる', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 新規登録ボタンをクリック
    const newButton = page.locator('a[href="/admin/admins/new"]');
    await newButton.click();

    // 新規登録ページに遷移することを確認
    await page.waitForURL('**/admin/admins/new');
    expect(page.url()).toContain('/admin/admins/new');
  });

  test('特権管理者を登録できる（フォーム表示確認）', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/new');
    await page.waitForLoadState('networkidle');

    // フォーム要素が表示されていることを確認
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // ロール選択
    const roleButton = page.locator('button[role="combobox"]').first();
    await roleButton.click();
    await page.waitForTimeout(300);

    // 特権管理者を選択
    await page.locator('text=特権管理者').first().click();
    await page.waitForTimeout(300);

    // コミュニティスコープ選択が表示されていないことを確認（特権管理者には不要）
    const communityScopeSection = page.locator('text=コミュニティスコープ');
    await expect(communityScopeSection).not.toBeVisible();
  });

  test('コミュニティ管理者を登録できる（フォーム表示確認）', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/new');
    await page.waitForLoadState('networkidle');

    // ロール選択
    const roleButton = page.locator('button[role="combobox"]').first();
    await roleButton.click();
    await page.waitForTimeout(300);

    // コミュニティ管理者を選択
    await page.locator('text=コミュニティ管理者').first().click();
    await page.waitForTimeout(500);

    // コミュニティスコープ選択が表示されることを確認
    const communityScopeSection = page.locator('text=コミュニティスコープ');
    await expect(communityScopeSection).toBeVisible();

    // チェックボックスが表示されていることを確認
    await expect(page.locator('input[value="ベンチャー監査役の会"]')).toBeVisible();
    await expect(page.locator('input[value="ないかんMeetup"]')).toBeVisible();
  });

  test('パスワードは12文字以上である必要がある', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/new');
    await page.waitForLoadState('networkidle');

    // フォームに入力（パスワードは11文字）
    await page.locator('input[name="lastName"]').fill('テスト');
    await page.locator('input[name="firstName"]').fill('太郎');
    await page.locator('input[name="email"]').fill(`test${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill('short12345'); // 11文字

    // ロール選択
    const roleButton = page.locator('button[role="combobox"]').first();
    await roleButton.click();
    await page.waitForTimeout(300);
    await page.locator('text=特権管理者').first().click();
    await page.waitForTimeout(300);

    // 送信を試みる
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // エラーメッセージが表示されることを確認
    const errorToast = page.locator('text=パスワードは12文字以上で入力してください');
    await expect(errorToast).toBeVisible();
  });
});

test.describe('管理者管理 - 編集', () => {
  test('管理者編集ページにアクセスできる', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 編集ボタンをクリック（最初の管理者）
    const editButton = page.locator('a').filter({ hasText: '編集' }).first();
    await editButton.click();

    // 編集ページに遷移することを確認
    await page.waitForURL('**/admin/admins/*/edit');
    expect(page.url()).toMatch(/\/admin\/admins\/.+\/edit/);
  });

  test('管理者情報が表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/A001/edit');
    await page.waitForLoadState('networkidle');

    // フォーム要素に値が入っていることを確認
    const lastNameInput = page.locator('input[name="lastName"]');
    const firstName = page.locator('input[name="firstName"]');
    const emailInput = page.locator('input[name="email"]');

    await expect(lastNameInput).toHaveValue('管理');
    await expect(firstName).toHaveValue('太郎');
    await expect(emailInput).toHaveValue('admin@example.com');
  });

  test('特権管理者のロールは変更できない', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/A001/edit');
    await page.waitForLoadState('networkidle');

    // ロールフィールドが読み取り専用であることを確認
    const roleButton = page.locator('button[role="combobox"]').first();
    const isDisabled = await roleButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('パスワードリセットセクションが表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/A002/edit');
    await page.waitForLoadState('networkidle');

    // パスワードリセットセクションが表示されることを確認
    const passwordResetSection = page.locator('text=パスワードリセット');
    await expect(passwordResetSection).toBeVisible();

    // パスワードリセットボタンが表示されることを確認
    const resetPasswordButton = page.locator('button').filter({ hasText: 'パスワードをリセット' });
    await expect(resetPasswordButton).toBeVisible();
  });
});

test.describe('管理者管理 - 削除', () => {
  test('管理者削除ボタンが表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 削除ボタンが表示されることを確認
    const deleteButtons = page.locator('button').filter({ hasText: '削除' });
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('削除確認ダイアログが表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 削除ボタンをクリック（2番目の管理者を削除）
    const deleteButton = page.locator('button').filter({ hasText: '削除' }).nth(1);
    await deleteButton.click();
    await page.waitForTimeout(500);

    // 確認ダイアログが表示されることを確認
    const confirmDialog = page.locator('text=本当に削除しますか');
    await expect(confirmDialog).toBeVisible();

    // キャンセルボタンがあることを確認
    const cancelButton = page.locator('button').filter({ hasText: 'キャンセル' });
    await expect(cancelButton).toBeVisible();

    // キャンセルをクリック
    await cancelButton.click();
    await page.waitForTimeout(300);
  });
});
