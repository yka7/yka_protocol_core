# YKA トークン 開発環境セットアップガイド

## 1. 必要条件

### 1.1 ソフトウェア要件

- Node.js v16.x 以上
- npm v8.x 以上
- Git

### 1.2 推奨開発環境

- VSCode
  - Solidity 拡張機能
  - TypeScript 拡張機能
  - ESLint 拡張機能
- Hardhat
- Foundry

## 2. 初期セットアップ

### 2.1 リポジトリのクローン

```bash
git clone https://github.com/nobu007/yka_protocol_core.git
cd yka_protocol_core
```

### 2.2 依存パッケージのインストール

```bash
# npmパッケージのインストール
npm install

# Foundryのインストール（まだの場合）
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2.3 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集
# 以下の変数を設定:
# - PRIVATE_KEY
# - AVALANCHE_RPC_URL
# - AVALANCHE_FUJI_RPC_URL
# - POLYGON_RPC_URL
# - POLYGON_AMOY_RPC_URL
# - ETHERSCAN_API_KEY
```

## 3. 開発ツール

### 3.1 使用ツール一覧

- Hardhat: Ethereum 開発環境
- Foundry: Solidity テストフレームワーク
- TypeChain: 型安全なコントラクト操作
- Ignition: デプロイメント管理
- Solhint: Solidity リンター
- Prettier: コードフォーマッター

### 3.2 ツールの設定

```bash
# Hardhat設定の確認
cat hardhat.config.ts

# Foundry設定の確認
cat foundry.toml

# Solhint設定の確認
cat .solhint.json
```

## 4. プロジェクト構造

```
yka_protocol_core/
├── contracts/          # スマートコントラクト
├── test/              # テストファイル
├── scripts/           # デプロイメントスクリプト
├── ignition/          # Ignitionモジュール
├── docs/              # ドキュメント
└── memory-bank/       # プロジェクト文脈管理
```

## 5. 開発フロー

### 5.1 コントラクト開発

```bash
# コントラクトのコンパイル
npm run compile

# テストの実行
npm run test

# Foundryテストの実行
forge test

# リンターの実行
npm run lint
```

### 5.2 ローカル開発環境

```bash
# ローカルノードの起動
npm run node

# テストネットへのデプロイ（Polygon Amoy）
npm run deploy:amoy

# テストネットへのデプロイ（Avalanche Fuji）
npm run deploy:fuji
```

## 6. テスト

### 6.1 テストの種類

- ユニットテスト
- 統合テスト
- ガス最適化テスト
- セキュリティテスト

### 6.2 テスト実行

```bash
# 全テストの実行
npm run test

# 特定のテストの実行
npm run test:token

# カバレッジレポート
npm run coverage
```

## 7. CI/CD 設定

### 7.1 GitHub Actions

- プルリクエスト時のテスト実行
- コードスタイルチェック
- セキュリティスキャン

### 7.2 自動デプロイ

- テストネットへの自動デプロイ
- メインネットデプロイの承認フロー

## 8. トラブルシューティング

### 8.1 一般的な問題

1. コンパイルエラー
2. テスト失敗
3. ガス見積もりエラー

### 8.2 デバッグツール

- Hardhat コンソール
- Foundry トレース
- エラーログ解析

## 9. ベストプラクティス

### 9.1 コーディング規約

- Solidity スタイルガイド準拠
- コメント記述ルール
- 命名規則

### 9.2 セキュリティガイドライン

- 入力バリデーション
- アクセス制御
- リエントランシー対策
- ガス最適化

## 10. 開発リソース

### 10.1 ドキュメント

- YKA トークン仕様書
- アーキテクチャガイド
- API リファレンス

### 10.2 サポートリソース

- GitHub Issues
- 技術サポート連絡先
- コミュニティチャンネル
