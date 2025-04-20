# YKAToken テスト仕様書

## ディレクトリ構造

```
test/
├── core/              # コア機能テスト
│   └── deployment.test.ts
├── economic/          # 経済シミュレーション
│   ├── distribution.test.ts
│   ├── approval.test.ts
│   └── simulation.test.ts
├── ownership/         # オーナーシップ管理
│   └── ownership.test.ts
└── transaction/       # トランザクション機能
    ├── transfer.test.ts
    └── approval.test.ts
```

## テスト実行方法

```bash
# 全テストの実行
npm test

# カテゴリごとの実行
npm test test/core/**.test.ts
npm test test/economic/**.test.ts
npm test test/ownership/**.test.ts
npm test test/transaction/**.test.ts

# 個別テストの実行
npm test test/core/deployment.test.ts
```

## テストカテゴリ

### Core Tests

[コアテスト仕様書](./core/deployment.md)

- コントラクトのデプロイメント
- 初期状態の検証
- 基本パラメータの確認

### Economic Tests

- [分配テスト仕様書](./economic/distribution.md)
- [承認テスト仕様書](./economic/approval.md)
- [シミュレーション仕様書](./economic/simulation.md)

### Ownership Tests

[オーナーシップテスト仕様書](./ownership/ownership.md)

- オーナー権限の管理
- 権限移転の検証
- アクセス制御

### Transaction Tests

- [転送テスト仕様書](./transaction/transfer.md)
- [承認テスト仕様書](./transaction/approval.md)

## 共通テスト方針

1. テストの独立性

   - 各テストは独自のコントラクトインスタンスを使用
   - テスト間の依存関係を排除

2. エラー処理の検証

   - 不正な入力値の処理
   - 権限エラーの確認
   - 残高不足の処理

3. イベント検証

   - 全てのイベント発行を確認
   - イベントパラメータの検証

4. タイムアウト対策
   - 適切なタイムアウト値の設定
   - 重い処理の分割実行
