# GitHub Workflows

このディレクトリには、YKA Protocol Coreで使用されるGitHub Actionsワークフローが含まれています。

## ワークフロー概要

### 1. Hardhat CI (`hardhat.yml`)

コントラクトのビルドと検証を行うワークフロー

**主な責務:**
- Solidityコントラクトのコンパイル
- リンター実行による静的解析
- ユニットテストの実行

**実行タイミング:**
- mainブランチへのプッシュ
- プルリクエスト作成時

### 2. Test CI (`test.yml`)

テスト実行と品質メトリクス管理を担当するワークフロー

**主な責務:**
- ユニットテストの実行
- カバレッジレポートの生成
- Codecovへのレポートアップロード
- テスト品質の監視

**実行タイミング:**
- mainブランチへのプッシュ
- プルリクエスト作成時

## 環境変数

### Hardhat CI で使用する環境変数

CI（lint・compile・test）に必須の変数はない。テスト実行時のオプション:

| 変数名 | 説明 | 必須 |
|--------|------|------|
| REPORT_GAS | ガスレポート有効化フラグ | - |
| COINMARKETCAP_API_KEY | CoinMarketCap API キー | - |

### デプロイスクリプト（ローカル実行 `npm run deploy:*`）で使用する環境変数

CIではデプロイを実行しない（2026-11-02 に "Deploy to Amoy" ステップを削除 — AmoyテストネットのRPC `rpc-amoy.polygon.technology` が名前解決不能になり、`AMOY_RPC_URL` secret も未設定のため全PR/pushで必ず失敗していた）。デプロイはローカルまたは手動ディスパッチで実行すること。

| 変数名 | 説明 | 必須 |
|--------|------|------|
| PRIVATE_KEY | デプロイ用ウォレットの秘密鍵 | ✅ |
| AMOY_RPC_URL | Amoyテストネットのエンドポイント（※テストネット廃止済みのため要移行） | ✅ |
| POLYGON_RPC_URL | Polygonネットワークのエンドポイント | ✅ |
| POLYGONSCAN_API_KEY | PolygonScan API キー | ✅ |
| INITIAL_SUPPLY | 初期供給量 | ✅ |
| MAX_SUPPLY | 最大供給量 | ✅ |
| AIRDROP_AMOUNT | エアドロップ量 | ✅ |

### Test CI で使用する環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| CODECOV_TOKEN | Codecovアップロード用トークン | ✅ |

## ワークフロー実行の順序

1. プルリクエスト作成時:
   1. Test CIが実行され、テストとカバレッジチェック
   2. Hardhat CIが実行され、コントラクトの検証

2. mainブランチへのマージ時:
   1. Test CIによるテスト実行
   2. Hardhat CIによるlint・コンパイル・テスト実行

## 注意事項

- 秘密情報は必ずGitHub Secretsを使用して管理
- ローカルテスト実行時とCI環境の設定の一貫性を維持
- カバレッジレポートは定期的に確認し、必要に応じて改善