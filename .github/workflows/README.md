# GitHub Workflows

このディレクトリには、YKA Protocol Coreで使用されるGitHub Actionsワークフローが含まれています。

## ワークフロー概要

### 1. Hardhat CI (`hardhat.yml`)

コントラクトのビルド、検証、デプロイメントを管理するワークフロー

**主な責務:**
- Solidityコントラクトのコンパイル
- リンター実行による静的解析
- テストネットへのデプロイ
- 環境変数と秘密情報の管理

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

| 変数名 | 説明 | 必須 |
|--------|------|------|
| PRIVATE_KEY | デプロイ用ウォレットの秘密鍵 | ✅ |
| AMOY_RPC_URL | Amoyテストネットのエンドポイント | ✅ |
| POLYGON_RPC_URL | Polygonネットワークのエンドポイント | ✅ |
| POLYGONSCAN_API_KEY | PolygonScan API キー | ✅ |
| INITIAL_SUPPLY | 初期供給量 | ✅ |
| MAX_SUPPLY | 最大供給量 | ✅ |
| AIRDROP_AMOUNT | エアドロップ量 | ✅ |
| REPORT_GAS | ガスレポート有効化フラグ | - |
| COINMARKETCAP_API_KEY | CoinMarketCap API キー | - |

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
   2. Hardhat CIによるテストネットデプロイ

## 注意事項

- 秘密情報は必ずGitHub Secretsを使用して管理
- ローカルテスト実行時とCI環境の設定の一貫性を維持
- カバレッジレポートは定期的に確認し、必要に応じて改善