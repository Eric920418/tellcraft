現在我已經在這個專案中建立了 Server Actions 的框架，
請你先仔細閱讀這些 BDD Feature Files (放在 spec/features/)
然後再閱讀測試腳本 (scripts/verify_actions.ts) 了解驗收標準

接著，快、狠、準地實作出對應的 Next.js Server Actions 程式碼
程式碼要良好分層 Clean Architecture、遵守 Clean Code 和 SOLID 原則
使用 Next.js 15 作為框架、Supabase 作為後端資料庫

專案結構：
```
app/
├── actions/
│   └── index.ts           # Server Actions 入口 (你要實作的)
├── lib/
│   └── supabase.ts        # Supabase client (你需要建立)
spec/
├── features/              # BDD Feature Files (規格)
└── data/
    └── schema.sql         # 資料庫 Schema (參考用)
```

技術要點：
1. 使用 Next.js Server Actions ('use server' directive)
2. 使用 Supabase JavaScript SDK (@supabase/supabase-js) 操作資料庫
3. 所有 Actions 都需要回傳明確的成功/失敗結果
4. 錯誤處理要完整，錯誤訊息要清楚
5. 使用 TypeScript 類型定義

最重要的是：你必須通過所有的測試。
每次實作完成後，執行 `./scripts/verify_typescript.sh` 確認測試是否通過。
如果有任何測試失敗，從測試報告中查看錯誤，持續修正直到所有測試通過。

測試執行：
```bash
./scripts/verify_typescript.sh
```
