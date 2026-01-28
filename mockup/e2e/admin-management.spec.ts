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

    // エラーメッセージは表示される想定だが、遷移タイミングで消えるためここでは確認しない
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

    // モックデータの管理者が表示されていることを確認（テーブル内のセルを指定）
    await expect(page.locator('tbody tr').filter({ hasText: '管理 太郎' })).toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: '監査 花子' })).toBeVisible();
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
    await page.waitForTimeout(1000); // 検索処理の待機時間を延長

    // フィルタリングされた結果を確認
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // 検索結果に「監査」が含まれていることを確認（氏名列に含まれる）
    const hasAuditText = await page.locator('tbody tr').filter({ hasText: '監査' }).count();
    expect(hasAuditText).toBeGreaterThan(0);
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
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();

    // ロール選択 - RadioGroupItem を探す
    const superRadio = page.locator('button#super');
    await superRadio.click();
    await page.waitForTimeout(300);

    // コミュニティスコープ選択が表示されていないことを確認（特権管理者には不要）
    const communityScopeSection = page.locator('text=コミュニティスコープ');
    await expect(communityScopeSection).not.toBeVisible();
  });

  test('コミュニティ管理者を登録できる（フォーム表示確認）', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/new');
    await page.waitForLoadState('networkidle');

    // ロール選択 - コミュニティ管理者を選択
    const communityAdminRadio = page.locator('button#community_admin');
    await communityAdminRadio.click();
    await page.waitForTimeout(500);

    // 対象コミュニティ選択が表示されることを確認
    const communityScopeSection = page.locator('text=対象コミュニティ');
    await expect(communityScopeSection).toBeVisible();

    // チェックボックスが表示されていることを確認
    await expect(page.locator('#scope-audit')).toBeVisible();
    await expect(page.locator('#scope-naikan')).toBeVisible();
  });

  test('パスワードは12文字以上である必要がある', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/new');
    await page.waitForLoadState('networkidle');

    // フォームに入力（パスワードは11文字）
    await page.locator('input#lastName').fill('テスト');
    await page.locator('input#firstName').fill('太郎');
    await page.locator('input#email').fill(`test${Date.now()}@example.com`);
    await page.locator('input#password').fill('short12345'); // 10文字

    // ロール選択 - 特権管理者を選択
    const superRadio = page.locator('button#super');
    await superRadio.click();
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
    const lastNameInput = page.locator('input#lastName');
    const firstName = page.locator('input#firstName');
    const emailInput = page.locator('input#email');

    await expect(lastNameInput).toHaveValue('管理');
    await expect(firstName).toHaveValue('太郎');
    await expect(emailInput).toHaveValue('admin@example.com');
  });

  test('特権管理者のロールは変更できない', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/A001/edit');
    await page.waitForLoadState('networkidle');

    // ロールのRadioGroupItemが無効化されていることを確認
    const superRadio = page.locator('button#super');
    const isDisabled = await superRadio.isDisabled();
    expect(isDisabled).toBe(true);
  });
});

test.describe('管理者管理 - 削除', () => {
  test('管理者削除ボタンが表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins');
    await page.waitForLoadState('networkidle');

    // 削除ボタン（ゴミ箱アイコン）が表示されることを確認
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' });
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('削除確認ダイアログが表示される', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/admin/admins/A002/edit');
    await page.waitForLoadState('networkidle');

    // 削除ボタンをクリック
    const deleteButton = page.locator('button').filter({ hasText: '削除' });
    await deleteButton.click();
    await page.waitForTimeout(500);

    // 確認ダイアログが表示されることを確認
    const confirmDialog = page.locator('text=管理者を削除');
    await expect(confirmDialog).toBeVisible();

    // キャンセルボタンがあることを確認
    const cancelButton = page.locator('button').filter({ hasText: 'キャンセル' });
    await expect(cancelButton).toBeVisible();

    // キャンセルをクリック
    await cancelButton.click();
    await page.waitForTimeout(300);
  });
});
