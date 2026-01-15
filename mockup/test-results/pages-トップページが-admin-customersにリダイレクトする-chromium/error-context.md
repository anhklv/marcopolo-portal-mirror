# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Marcopolo Admin" [level=1] [ref=e15]
      - paragraph [ref=e16]: 管理者ログイン
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: メールアドレス
        - textbox "メールアドレス" [ref=e20]:
          - /placeholder: admin@example.com
      - generic [ref=e21]:
        - generic [ref=e22]: パスワード
        - textbox "パスワード" [ref=e23]:
          - /placeholder: パスワードを入力
      - button "ログイン" [ref=e24] [cursor=pointer]
    - generic [ref=e25]:
      - paragraph [ref=e26]: "開発用アカウント:"
      - paragraph [ref=e27]: admin@example.com / password123
  - region "Notifications alt+T"
```